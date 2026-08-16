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

  // moderation_status is not column-granted to `authenticated`; the definer
  // function re-checks the caller's role, so a forged request cannot moderate.
  const { error } = await supabase.rpc("moderate_setup", { p_slug: body.slug, p_status: body.status, p_note: body.note?.trim() || null });
  if (error) {
    const forbidden = error.code === "42501" || error.message.includes("not authorised");
    return NextResponse.json({ error: forbidden ? "Недостатньо прав." : "Не вдалося оновити статус." }, { status: forbidden ? 403 : 500 });
  }

  return NextResponse.json({ slug: body.slug, status: body.status });
}
