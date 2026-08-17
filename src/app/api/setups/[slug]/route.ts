import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { setupColumns, syncRelations, validate, type SetupPayload } from "@/lib/setup-payload";
import { getDictionary } from "@/lib/i18n/server";

const decode = (slug: string) => { try { return decodeURIComponent(slug); } catch { return slug; } };

/** Owner edits their own setup. Any edit sends it back through moderation so
 *  approved content cannot be swapped out after the fact. */
export async function PATCH(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const t = await getDictionary();
  if (!hasSupabaseEnv()) return NextResponse.json({ error: t.errors.supabaseNotConfigured }, { status: 503 });
  const { slug } = await params;
  const body = await request.json() as SetupPayload;
  const invalid = validate(body, t);
  if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: t.errors.signInToEdit }, { status: 401 });

  const { data: setup } = await supabase.from("setups").select("id, owner_id").eq("slug", decode(slug)).maybeSingle();
  if (!setup) return NextResponse.json({ error: t.errors.setupNotFound }, { status: 404 });
  if (setup.owner_id !== userId) return NextResponse.json({ error: t.errors.notYourSetup }, { status: 403 });

  // Content columns are the only ones members hold UPDATE on; moderation state
  // is reset through a definer function that can only move a setup back to
  // `pending`, never approve it.
  const { error: updateError } = await supabase.from("setups").update(setupColumns(body)).eq("id", setup.id);
  if (updateError) {
    console.error("PATCH setup", updateError);
    return NextResponse.json({ error: t.errors.saveFailed }, { status: 500 });
  }

  const { error: reviewError } = await supabase.rpc("request_setup_review", { p_slug: decode(slug) });
  if (reviewError) {
    console.error("request_setup_review", reviewError);
    return NextResponse.json({ error: t.errors.submitReviewFailed }, { status: 500 });
  }

  const relationError = await syncRelations(supabase, setup.id, userId, body, t);
  if (relationError) return NextResponse.json({ error: relationError }, { status: 500 });

  return NextResponse.json({ slug: decode(slug), moderationStatus: "pending" });
}

/** Owner or admin deletes a setup. */
export async function DELETE(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const t = await getDictionary();
  if (!hasSupabaseEnv()) return NextResponse.json({ error: t.errors.supabaseNotConfigured }, { status: 503 });
  const { slug } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: t.errors.signInToDelete }, { status: 401 });

  const { data: setup } = await supabase.from("setups").select("id, owner_id").eq("slug", decode(slug)).maybeSingle();
  if (!setup) return NextResponse.json({ error: t.errors.setupNotFound }, { status: 404 });

  // Deletion is owner-or-admin only: moderators can reject but never destroy.
  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", userId).maybeSingle();
  if (setup.owner_id !== userId && !profile?.is_admin) return NextResponse.json({ error: t.errors.deleteForbidden }, { status: 403 });

  const { error } = await supabase.from("setups").delete().eq("id", setup.id);
  if (error) return NextResponse.json({ error: t.errors.deleteFailed }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
