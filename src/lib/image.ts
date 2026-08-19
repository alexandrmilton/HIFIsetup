/** Browser-side downscale + recompress, so a member can pick a 12 MB phone
 *  photo and we store something the bucket accepts instead of rejecting it.
 *  The storage bucket still enforces its own ceiling as the backstop. */

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
/** Long edge. Comfortably past the largest size any layout renders at 2x. */
const MAX_EDGE = 2000;
const QUALITY_STEPS = [0.82, 0.7, 0.58, 0.46, 0.35];

export const isImage = (file: File) => file.type.startsWith("image/");

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

/** Returns a file at or under MAX_UPLOAD_BYTES, or throws if the image cannot
 *  be decoded at all. Small images are still re-encoded only when they need to
 *  be — an already-tiny JPEG is returned untouched. */
export async function compressImage(file: File): Promise<File> {
  if (file.size <= MAX_UPLOAD_BYTES) return file;

  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error("decode-failed");

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

  return new File([smallest], name, { type });
}
