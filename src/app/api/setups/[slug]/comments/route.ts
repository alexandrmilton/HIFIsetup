import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

const decode = (slug: string) => { try { return decodeURIComponent(slug); } catch { return slug; } };

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "Supabase не налаштований." }, { status: 503 });
  const { slug } = await params;
  const body = await request.json() as { body?: string };
  const text = body.body?.trim();
  if (!text) return NextResponse.json({ error: "Напишіть щось." }, { status: 400 });
  if (text.length > 2000) return NextResponse.json({ error: "Коментар задовгий (максимум 2000 символів)." }, { status: 400 });

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Увійдіть, щоб коментувати." }, { status: 401 });

  const { data: setup } = await supabase.from("setups").select("id").eq("slug", decode(slug)).maybeSingle();
  if (!setup) return NextResponse.json({ error: "Сетап не знайдено." }, { status: 404 });

  const { data, error } = await supabase.from("setup_comments")
    .insert({ setup_id: setup.id, author_id: userId, body: text })
    .select("id, body, created_at").single();
  if (error) return NextResponse.json({ error: "Не вдалося зберегти коментар." }, { status: 500 });

  return NextResponse.json({ comment: data }, { status: 201 });
}

export async function DELETE(request: Request) {
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "Supabase не налаштований." }, { status: 503 });
  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Не вказано коментар." }, { status: 400 });

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) return NextResponse.json({ error: "Увійдіть." }, { status: 401 });

  // RLS restricts deletion to the comment's author or an admin.
  const { error } = await supabase.from("setup_comments").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Не вдалося видалити коментар." }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
