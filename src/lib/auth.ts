import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type CurrentProfile = { id: string; email: string | null; displayName: string | null; username: string | null; avatarPath: string | null; bio: string | null };

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
  const { data: profile } = await supabase.from("profiles").select("display_name, username, avatar_path, bio").eq("id", user.id).maybeSingle();
  return { id: user.id, email: user.email ?? null, displayName: profile?.display_name ?? null, username: profile?.username ?? null, avatarPath: profile?.avatar_path ?? null, bio: profile?.bio ?? null };
}
