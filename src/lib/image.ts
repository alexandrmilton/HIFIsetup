/** Browser-side decode, downscale and re-encode, so a member can pick a 12 MB
 *  iPhone HEIC and we store something the bucket accepts instead of rejecting
 *  it. The storage bucket still enforces its own ceiling as the backstop. */

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
/** Anything past this is re-encoded even though the bucket would accept it.
 *  A 1.9 MB JPEG sailed through the old size-only check untouched and then had
 *  to be downloaded in full by every page that showed it. */
const RECOMPRESS_OVER = 700 * 1024;
/** Long edge. Comfortably past the largest size any layout renders at 2x. */
const MAX_EDGE = 2000;
const QUALITY_STEPS = [0.82, 0.7, 0.58, 0.46, 0.35];
/** The only types the storage bucket will take — anything else is re-encoded. */
const BUCKET_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const IMAGE_EXTENSION = /\.(hei[cf]|avif|jpe?g|png|webp|gif|bmp|tiff?|jfif|dng)$/i;

/** Windows reports an empty MIME type for .heic, so the extension has to count
 *  too. Anything that slips through is caught by the decode step below. */
export const isImage = (file: File) =>
  file.type.startsWith("image/") || IMAGE_EXTENSION.test(file.name) || file.type === "";

/** WebP is both smaller and allowed by the bucket; fall back where it is not
 *  encodable (older Safari). Detected once, lazily. */
let webpSupport: boolean | null = null;
function supportsWebp() {
  if (webpSupport === null) {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    webpSupport = canvas.toDataURL("image/webp").startsWith("data:image/webp");
  }
  return webpSupport;
}

const toBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));

/** Safari decodes HEIC natively; everywhere else needs libheif, which is a
 *  couple of megabytes of WASM — so it is only fetched once a file actually
 *  fails to decode, keeping ordinary JPEG uploads free of it. */
async function decode(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch {
    try {
      // Plain entry point, not "heic-to/next" — that build targets web workers,
      // and this runs on the main thread.
      const { heicTo } = await import("heic-to");
      return await heicTo({ blob: file, type: "bitmap" });
    } catch {
      throw new Error("decode-failed");
    }
  }
}

/** Cards, gallery strips and admin lists paint photos between 56px and 255px.
 *  Serving the 2000px original to all of them was most of the home page's
 *  weight, so every upload also gets a 600px copy — crisp at 2x on the largest
 *  of those, and roughly a quarter of the bytes. */
const THUMB_EDGE = 600;
const THUMB_QUALITY = 0.72;

async function encode(bitmap: ImageBitmap, maxEdge: number, quality: number, type: string) {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("decode-failed");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return { canvas, blob: await toBlob(canvas, type, quality) };
}

/** The small copy used everywhere a photo is shown at thumbnail size. */
export async function makeThumbnail(file: File): Promise<File | null> {
  const bitmap = await decode(file).catch(() => null);
  if (!bitmap) return null;
  const type = supportsWebp() ? "image/webp" : "image/jpeg";
  const { blob } = await encode(bitmap, THUMB_EDGE, THUMB_QUALITY, type);
  bitmap.close();
  if (!blob) return null;
  const extension = type === "image/webp" ? "webp" : "jpg";
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + "." + extension, { type });
}

/** Returns a file the bucket will accept, or throws if the image cannot be
 *  decoded at all. An already-small JPEG/PNG/WebP is passed through untouched;
 *  every other format is re-encoded even when it is small, because the bucket
 *  would refuse it otherwise. */
export async function compressImage(file: File): Promise<File> {
  if (file.size <= RECOMPRESS_OVER && BUCKET_TYPES.has(file.type)) return file;

  const bitmap = await decode(file);

  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));

  const context = canvas.getContext("2d");
  if (!context) throw new Error("decode-failed");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  const type = supportsWebp() ? "image/webp" : "image/jpeg";
  const extension = type === "image/webp" ? "webp" : "jpg";
  const name = file.name.replace(/\.[^.]+$/, "") + "." + extension;

  let smallest: Blob | null = null;
  for (const quality of QUALITY_STEPS) {
    const blob = await toBlob(canvas, type, quality);
    if (!blob) continue;
    smallest = blob;
    if (blob.size <= MAX_UPLOAD_BYTES) break;
  }
  if (!smallest) throw new Error("decode-failed");

  // Every quality step was still too big — halve the dimensions once and take
  // the lowest quality. A 2000px photo that will not fit at 0.35 is pathological.
  if (smallest.size > MAX_UPLOAD_BYTES) {
    const half = document.createElement("canvas");
    half.width = Math.max(1, Math.round(canvas.width / 2));
    half.height = Math.max(1, Math.round(canvas.height / 2));
    half.getContext("2d")?.drawImage(canvas, 0, 0, half.width, half.height);
    const retry = await toBlob(half, type, 0.6);
    if (retry && retry.size < smallest.size) smallest = retry;
  }

  // Re-encoding a well-optimised photo can lose: keep whichever is smaller,
  // as long as the original is a format the bucket accepts.
  if (smallest.size >= file.size && BUCKET_TYPES.has(file.type) && file.size <= MAX_UPLOAD_BYTES) return file;

  return new File([smallest], name, { type });
}
