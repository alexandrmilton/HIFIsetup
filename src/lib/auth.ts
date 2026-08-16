import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type CurrentProfile = { id: string; email: string | null; displayName: string | null; username: string | null; avatarPath: string | null; bio: string | null };

export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  if (!hasSupabaseEnv()) return null;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("display_name, username, avatar_path, bio").eq("id", user.id).maybeSingle();
  return { id: user.id, email: user.email ?? null, displayName: profile?.display_name ?? null, username: profile?.username ?? null, avatarPath: profile?.avatar_path ?? null, bio: profile?.bio ?? null };
}
