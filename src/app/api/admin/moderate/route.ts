import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const allowed = new Set(["approved", "rejected", "pending"]);

/** Admins and moderators approve or reject. Deletion stays admin-only and
 *  lives in a separate route; RLS repeats both checks. */
export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "Supabase не налаштований." }, { status: 503 });
  const body = await request.json() as { slug?: string; status?: string; note?: string };
  if (!body.slug || !body.status || !allowed.has(body.status)) return NextResponse.json({ error: "Некоректний запит." }, { status: 400 });

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Увійдіть." }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("is_admin, is_moderator").eq("id", userId).maybeSingle();
  if (!profile?.is_admin && !profile?.is_moderator) return NextResponse.json({ error: "Недостатньо прав." }, { status: 403 });

  const { error } = await supabase.from("setups")
    .update({ moderation_status: body.status, moderation_note: body.note?.trim() || null, reviewed_at: new Date().toISOString() })
    .eq("slug", body.slug);
  if (error) return NextResponse.json({ error: "Не вдалося оновити статус." }, { status: 500 });

  return NextResponse.json({ slug: body.slug, status: body.status });
}
