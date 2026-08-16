export const hasSupabaseEnv = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

export const avatarUrl = (path: string | null | undefined) => path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/setup-images/${path}` : null;
export const coverUrl = avatarUrl;
