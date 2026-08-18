import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { getDictionary } from "@/lib/i18n/server";
import { COMPONENT_CATEGORIES } from "@/lib/component-meta";

const ORIGINS = new Set(["standard", "handmade", "custom_order"]);

/** Admin-only: correct a member-submitted catalogue entry. Same definer-gated
 *  path as DELETE — `components` grants no direct UPDATE to members either. */
export async function PATCH(request: Request) {
  const t = await getDictionary();
  if (!hasSupabaseEnv()) return NextResponse.json({ error: t.errors.supabaseNotConfigured }, { status: 503 });

  const body = await request.json() as { id?: string; brand?: string; model?: string; category?: string; origin?: string };
  const brand = body.brand?.trim();
  const model = body.model?.trim();
  // Category is a closed vocabulary; reject anything outside it so a bad edit
  // cannot orphan a component from the picker's groups and icon map.
  const categoryValid = Boolean(body.category && COMPONENT_CATEGORIES.includes(body.category));
  if (!body.id || !brand || !model || !categoryValid || !ORIGINS.has(body.origin ?? "")) {
    return NextResponse.json({ error: t.errors.invalidRequest }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  if (!claimsData?.claims?.sub) return NextResponse.json({ error: t.errors.signIn }, { status: 401 });

  const { error } = await supabase.rpc("update_component", {
    p_id: body.id, p_brand: brand, p_model: model, p_category: body.category, p_origin: body.origin,
  });
  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: t.errors.componentDuplicate }, { status: 409 });
    const forbidden = error.code === "42501" || error.message.includes("not authorised");
    return NextResponse.json({ error: forbidden ? t.errors.forbidden : t.errors.componentUpdateFailed }, { status: forbidden ? 403 : 500 });
  }

  return NextResponse.json({ updated: true });
}

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
