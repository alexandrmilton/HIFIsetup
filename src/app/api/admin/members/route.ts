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

  // is_moderator is not column-granted to `authenticated`; the definer function
  // re-checks that the caller is an admin.
  const { error } = await supabase.rpc("set_member_moderator", { p_user_id: body.userId, p_is_moderator: body.isModerator });
  if (error) {
    const forbidden = error.code === "42501" || error.message.includes("not authorised");
    return NextResponse.json({ error: forbidden ? "Недостатньо прав." : "Не вдалося змінити роль." }, { status: forbidden ? 403 : 500 });
  }

  return NextResponse.json({ userId: body.userId, isModerator: body.isModerator });
}
