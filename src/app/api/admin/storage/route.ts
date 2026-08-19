import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";

/** Files younger than this may still belong to a wizard someone has open. */
const MIN_AGE_HOURS = 24;

/** Admin-only: drop storage objects no setup cover, gallery row or avatar
 *  points at. The list comes from a definer function that re-checks the
 *  caller's admin flag, so the route cannot be tricked into a wider delete. */
export async function DELETE() {
  const t = await getDictionary();
  if (!hasSupabaseEnv()) return NextResponse.json({ error: t.errors.supabaseNotConfigured }, { status: 503 });

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) return NextResponse.json({ error: t.errors.signIn }, { status: 401 });

  const { data, error } = await supabase.rpc("list_orphan_images", { p_min_age_hours: MIN_AGE_HOURS });
  if (error) {
    const forbidden = error.code === "42501" || error.message.includes("not authorised");
    return NextResponse.json({ error: forbidden ? t.errors.forbidden : t.errors.purgeFailed }, { status: forbidden ? 403 : 500 });
  }

  const orphans = (data as { path: string; bytes: number }[] | null) ?? [];
  if (orphans.length === 0) return NextResponse.json({ removed: 0, bytes: 0 });

  const { data: removed, error: removeError } = await supabase.storage
    .from("setup-images")
    .remove(orphans.map((file) => file.path));
  if (removeError) return NextResponse.json({ error: t.errors.purgeFailed }, { status: 500 });

  // Report what storage actually accepted, not what we asked it to drop.
  const removedPaths = new Set((removed ?? []).map((file) => file.name));
  const freed = orphans.filter((file) => removedPaths.has(file.path)).reduce((sum, file) => sum + Number(file.bytes ?? 0), 0);
  return NextResponse.json({ removed: removedPaths.size, bytes: freed });
}
