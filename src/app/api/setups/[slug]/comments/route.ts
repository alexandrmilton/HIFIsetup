import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";

const decode = (slug: string) => { try { return decodeURIComponent(slug); } catch { return slug; } };

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const t = await getDictionary();
  if (!hasSupabaseEnv()) return NextResponse.json({ error: t.errors.supabaseNotConfigured }, { status: 503 });
  const { slug } = await params;
  const body = await request.json() as { body?: string };
  const text = body.body?.trim();
  if (!text) return NextResponse.json({ error: t.errors.writeSomething }, { status: 400 });
  if (text.length > 2000) return NextResponse.json({ error: t.errors.commentTooLong }, { status: 400 });

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: t.errors.signInToComment }, { status: 401 });

  const { data: setup } = await supabase.from("setups").select("id").eq("slug", decode(slug)).maybeSingle();
  if (!setup) return NextResponse.json({ error: t.errors.setupNotFound }, { status: 404 });

  const { data, error } = await supabase.from("setup_comments")
    .insert({ setup_id: setup.id, author_id: userId, body: text })
    .select("id, body, created_at").single();
  if (error) return NextResponse.json({ error: t.errors.commentSaveFailed }, { status: 500 });

  return NextResponse.json({ comment: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  const t = await getDictionary();
  if (!hasSupabaseEnv()) return NextResponse.json({ error: t.errors.supabaseNotConfigured }, { status: 503 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: t.errors.commentMissing }, { status: 400 });

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) return NextResponse.json({ error: t.errors.signIn }, { status: 401 });

  // RLS restricts deletion to the comment's author or an admin.
  const { error } = await supabase.from("setup_comments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: t.errors.commentDeleteFailed }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
