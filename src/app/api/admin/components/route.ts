import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";

/** Admin-only: remove a member-submitted entry from the shared catalogue.
 *  `components` has no DELETE policy, so the definer function is the only
 *  path and it re-checks the caller's admin flag itself. */
export async function DELETE(request: Request) {
  const t = await getDictionary();
  if (!hasSupabaseEnv()) return NextResponse.json({ error: t.errors.supabaseNotConfigured }, { status: 503 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: t.errors.invalidRequest }, { status: 400 });

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) return NextResponse.json({ error: t.errors.signIn }, { status: 401 });

  const { error } = await supabase.rpc("delete_component", { p_id: id });
  if (error) {
    const forbidden = error.code === "42501" || error.message.includes("not authorised");
    return NextResponse.json({ error: forbidden ? t.errors.forbidden : t.errors.componentDeleteFailed }, { status: forbidden ? 403 : 500 });
  }

  return NextResponse.json({ deleted: true });
}
