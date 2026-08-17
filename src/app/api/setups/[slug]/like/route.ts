import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";

async function resolve(slug: string) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  const decoded = (() => { try { return decodeURIComponent(slug); } catch { return slug; } })();
  const { data: setup } = await supabase.from("setups").select("id").eq("slug", decoded).maybeSingle();
  return { supabase, userId, setupId: setup?.id as string | undefined };
}

export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const t = await getDictionary();
  if (!hasSupabaseEnv()) return NextResponse.json({ error: t.errors.supabaseNotConfigured }, { status: 503 });
  const { slug } = await params;
  const { supabase, userId, setupId } = await resolve(slug);
  if (!userId) return NextResponse.json({ error: t.errors.signInToLike }, { status: 401 });
  if (!setupId) return NextResponse.json({ error: t.errors.setupNotFound }, { status: 404 });

  const { error } = await supabase.from("setup_likes").insert({ setup_id: setupId, user_id: userId });
  // A duplicate just means it was already liked — treat as success.
  if (error && error.code !== "23505") return NextResponse.json({ error: t.errors.likeSaveFailed }, { status: 500 });

  const { count } = await supabase.from("setup_likes").select("*", { count: "exact", head: true }).eq("setup_id", setupId);
  return NextResponse.json({ liked: true, count: count ?? 0 });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const t = await getDictionary();
  if (!hasSupabaseEnv()) return NextResponse.json({ error: t.errors.supabaseNotConfigured }, { status: 503 });
  const { slug } = await params;
  const { supabase, userId, setupId } = await resolve(slug);
  if (!userId) return NextResponse.json({ error: t.errors.signInToLike }, { status: 401 });
  if (!setupId) return NextResponse.json({ error: t.errors.setupNotFound }, { status: 404 });

  await supabase.from("setup_likes").delete().eq("setup_id", setupId).eq("user_id", userId);
  const { count } = await supabase.from("setup_likes").select("*", { count: "exact", head: true }).eq("setup_id", setupId);
  return NextResponse.json({ liked: false, count: count ?? 0 });
}
