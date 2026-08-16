import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type CurrentProfile = { id: string; email: string | null; displayName: string | null; username: string | null; avatarPath: string | null; bio: string | null; isAdmin: boolean; isModerator: boolean };

/** Slugs the signed-in user has liked, for rendering card like states. */
export async function getLikedSlugs(): Promise<string[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase.from("setup_likes").select("setups(slug)").eq("user_id", user.id);
  return (data ?? []).flatMap((row) => {
    const setup = (row as { setups: { slug: string } | { slug: string }[] | null }).setups;
    if (!setup) return [];
    return Array.isArray(setup) ? setup.map((entry) => entry.slug) : [setup.slug];
  });
}

/** Whether the signed-in user already liked this setup (false when signed out). */
export async function hasLikedSetup(slug: string): Promise<boolean> {
  if (!hasSupabaseEnv()) return false;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const decoded = (() => { try { return decodeURIComponent(slug); } catch { return slug; } })();
  const { data: setup } = await supabase.from("setups").select("id").eq("slug", decoded).maybeSingle();
  if (!setup) return false;
  const { data: like } = await supabase.from("setup_likes").select("setup_id").eq("setup_id", setup.id).eq("user_id", user.id).maybeSingle();
  return Boolean(like);
}

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("display_name, username, avatar_path, bio, is_admin, is_moderator").eq("id", user.id).maybeSingle();
  return { id: user.id, email: user.email ?? null, displayName: profile?.display_name ?? null, username: profile?.username ?? null, avatarPath: profile?.avatar_path ?? null, bio: profile?.bio ?? null, isAdmin: profile?.is_admin ?? false, isModerator: profile?.is_moderator ?? false };
}
