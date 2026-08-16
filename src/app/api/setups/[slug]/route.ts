import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { setupColumns, syncRelations, validate, type SetupPayload } from "@/lib/setup-payload";

const decode = (slug: string) => { try { return decodeURIComponent(slug); } catch { return slug; } };

/** Owner edits their own setup. Any edit sends it back through moderation so
 *  approved content cannot be swapped out after the fact. */
export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "Supabase не налаштований." }, { status: 503 });
  const { slug } = await params;
  const body = await request.json() as SetupPayload;
  const invalid = validate(body);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Увійдіть, щоб редагувати сетап." }, { status: 401 });

  const { data: setup } = await supabase.from("setups").select("id, owner_id").eq("slug", decode(slug)).maybeSingle();
  if (!setup) return NextResponse.json({ error: "Сетап не знайдено." }, { status: 404 });
  if (setup.owner_id !== userId) return NextResponse.json({ error: "Це не ваш сетап." }, { status: 403 });

  const { error: updateError } = await supabase.from("setups")
    .update({ ...setupColumns(body), moderation_status: "pending", reviewed_at: null })
    .eq("id", setup.id);
  if (updateError) return NextResponse.json({ error: "Не вдалося зберегти зміни." }, { status: 500 });

  const relationError = await syncRelations(supabase, setup.id, userId, body);
  if (relationError) return NextResponse.json({ error: relationError }, { status: 500 });

  return NextResponse.json({ slug: decode(slug), moderationStatus: "pending" });
}

/** Owner or admin deletes a setup. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "Supabase не налаштований." }, { status: 503 });
  const { slug } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Увійдіть, щоб видалити сетап." }, { status: 401 });

  const { data: setup } = await supabase.from("setups").select("id, owner_id").eq("slug", decode(slug)).maybeSingle();
  if (!setup) return NextResponse.json({ error: "Сетап не знайдено." }, { status: 404 });

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", userId).maybeSingle();
  if (setup.owner_id !== userId && !profile?.is_admin) return NextResponse.json({ error: "Недостатньо прав." }, { status: 403 });

  const { error } = await supabase.from("setups").delete().eq("id", setup.id);
  if (error) return NextResponse.json({ error: "Не вдалося видалити сетап." }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
