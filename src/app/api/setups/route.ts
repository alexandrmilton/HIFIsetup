import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { AudioComponent, ComponentOrigin } from "@/lib/types";

const validOrigins = new Set<ComponentOrigin>(["standard", "handmade", "custom_order"]);
const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9а-яіїєґ]+/gi, "-").replace(/(^-|-$)/g, "") || "setup";

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) return NextResponse.json({ error: "Supabase не налаштований." }, { status: 503 });
  const body = await request.json() as { title?: string; location?: string; description?: string; isPublished?: boolean; components?: AudioComponent[] };
  if (!body.title?.trim() || !Array.isArray(body.components) || body.components.length === 0) return NextResponse.json({ error: "Вкажіть назву та додайте компонент." }, { status: 400 });
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (claimsError || !userId) return NextResponse.json({ error: "Увійдіть, щоб зберегти сетап." }, { status: 401 });
  await supabase.from("profiles").upsert({ id: userId, display_name: claimsData.claims.email?.split("@")[0] ?? "Слухач" });
  const { data: createdSetup, error: setupError } = await supabase.from("setups").insert({ owner_id: userId, title: body.title.trim(), slug: `${slugify(body.title)}-${crypto.randomUUID().slice(0, 6)}`, city: body.location?.trim() || null, description: body.description?.trim() || null, is_published: body.isPublished === true }).select("id, slug").single();
  if (setupError || !createdSetup) return NextResponse.json({ error: "Не вдалося створити сетап." }, { status: 500 });
  const componentIds: string[] = [];
  for (const component of body.components) {
    if (component.id.startsWith("new-") && component.brand?.trim() && component.model?.trim() && validOrigins.has(component.origin)) {
      const { data, error } = await supabase.from("components").insert({ brand: component.brand.trim(), model: component.model.trim(), category: component.category || "Інше", origin: component.origin, submitted_by: userId }).select("id").single();
      if (error || !data) return NextResponse.json({ error: "Не вдалося додати власний компонент." }, { status: 500 });
      componentIds.push(data.id);
    } else componentIds.push(component.id);
  }
  const { error: relationError } = await supabase.from("setup_components").insert(componentIds.map((componentId, position) => ({ setup_id: createdSetup.id, component_id: componentId, position })));
  if (relationError) return NextResponse.json({ error: "Сетап створено, але компоненти не збережені." }, { status: 500 });
  return NextResponse.json({ slug: createdSetup.slug }, { status: 201 });
}
