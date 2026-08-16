import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import { setupColumns, syncRelations, validate, type SetupPayload } from "@/lib/setup-payload";

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "Supabase не налаштований." }, { status: 503 });
  const body = await request.json() as SetupPayload;
  const invalid = validate(body);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return NextResponse.json({ error: "Увійдіть, щоб зберегти сетап." }, { status: 401 });

  // Every new setup enters the moderation queue; it only reaches the feed once
  // an admin approves it.
  const { data: createdSetup, error: setupError } = await supabase.from("setups")
    .insert({ ...setupColumns(body), owner_id: userId, slug: `${slugify(body.title!)}-${crypto.randomUUID().slice(0, 6)}`, moderation_status: "pending" })
    .select("id, slug").single();
  if (setupError || !createdSetup) return NextResponse.json({ error: "Не вдалося створити сетап." }, { status: 500 });

  const relationError = await syncRelations(supabase, createdSetup.id, userId, body);
  if (relationError) return NextResponse.json({ error: relationError }, { status: 500 });

  return NextResponse.json({ slug: createdSetup.slug, moderationStatus: "pending" }, { status: 201 });
}
