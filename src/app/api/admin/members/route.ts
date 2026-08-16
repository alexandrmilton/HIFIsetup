import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

/** Admin-only: grant or revoke the moderator role. Admin status itself is not
 *  editable here — that stays a deliberate database-level action. */
export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "Supabase не налаштований." }, { status: 503 });
  const body = await request.json() as { userId?: string; isModerator?: boolean };
  if (!body.userId || typeof body.isModerator !== "boolean") return NextResponse.json({ error: "Некоректний запит." }, { status: 400 });

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Увійдіть." }, { status: 401 });

  const { data: me } = await supabase.from("profiles").select("is_admin").eq("id", userId).maybeSingle();
  if (!me?.is_admin) return NextResponse.json({ error: "Недостатньо прав." }, { status: 403 });

  const { error } = await supabase.from("profiles").update({ is_moderator: body.isModerator }).eq("id", body.userId);
  if (error) return NextResponse.json({ error: "Не вдалося змінити роль." }, { status: 500 });

  return NextResponse.json({ userId: body.userId, isModerator: body.isModerator });
}
