export const hasSupabaseEnv = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export const avatarUrl = (path: string | null | undefined) => path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/setup-images/${path}` : null;
export const coverUrl = avatarUrl;

/** Photos uploaded from this version live under `photos/`, with a small copy at
 *  the same name under `photos/thumbs/`. Anything still under the older
 *  `covers/` prefix has no small copy, so it falls back to the full image —
 *  which is exactly how it behaved before thumbnails existed. */
export const PHOTO_PREFIX = "photos/";
export const THUMB_PREFIX = "photos/thumbs/";

export const hasThumb = (path: string | null | undefined): path is string =>
  Boolean(path && path.startsWith(PHOTO_PREFIX) && !path.startsWith(THUMB_PREFIX));

export const thumbPath = (path: string) =>
  hasThumb(path) ? THUMB_PREFIX + path.slice(PHOTO_PREFIX.length) : path;

export const thumbUrl = (path: string | null | undefined) =>
  path ? coverUrl(thumbPath(path)) : null;
