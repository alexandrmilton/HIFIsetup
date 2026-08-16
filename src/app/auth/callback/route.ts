import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next")?.startsWith("/") ? url.searchParams.get("next")! : "/";
  if (code && hasSupabaseEnv()) { const supabase = await createClient(); await supabase.auth.exchangeCodeForSession(code); }
  return NextResponse.redirect(new URL(next, url.origin));
}
