import { getDemoSetup, demoSetups } from "@/lib/demo-data";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { ComponentOrigin, Setup } from "@/lib/types";

type DatabaseComponent = { id: string; brand: string; model: string; category: string; origin: ComponentOrigin; image_url: string | null };
type DatabaseSetupComponent = { position: number; components: DatabaseComponent | DatabaseComponent[] | null };
type DatabaseSetup = { slug: string; title: string; city: string | null; description: string | null; profiles: { display_name: string | null } | { display_name: string | null }[] | null; setup_components: DatabaseSetupComponent[] | null };

const palettes = [{ background: "#dce4dc", wall: "#e9ddc6" }, { background: "#dce7e2", wall: "#cbd9d1" }, { background: "#e6ded1", wall: "#d8b798" }];
const mapSetup = (row: DatabaseSetup, index = 0): Setup => { const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles; const relations = (row.setup_components ?? []).map((relation) => ({ position: relation.position, component: Array.isArray(relation.components) ? relation.components[0] : relation.components })).filter((relation): relation is { position: number; component: DatabaseComponent } => relation.component !== null && relation.component !== undefined).sort((a, b) => a.position - b.position); return { slug: row.slug, title: row.title, location: row.city ?? "Україна", owner: profile?.display_name ?? "roomtone listener", description: row.description ?? "Особистий простір для уважного слухання.", vibe: `${relations.length} компоненти`, palette: palettes[index % palettes.length], components: relations.map(({ component }) => ({ id: component.id, brand: component.brand, model: component.model, category: component.category, origin: component.origin, imageUrl: component.image_url })) }; };
const selectSetup = "slug, title, city, description, profiles(display_name), setup_components(position, components(id, brand, model, category, origin, image_url))";

export async function getPublishedSetups(): Promise<Setup[]> {
  if (!hasSupabaseEnv()) return demoSetups;
  const supabase = await createClient();
  const { data } = await supabase.from("setups").select(selectSetup).eq("is_published", true).order("created_at", { ascending: false });
  return data?.length ? (data as DatabaseSetup[]).map(mapSetup) : demoSetups;
}

export async function getSetup(slug: string): Promise<Setup | undefined> {
  if (!hasSupabaseEnv()) return getDemoSetup(slug);
  const supabase = await createClient();
  const { data } = await supabase.from("setups").select(selectSetup).eq("slug", slug).maybeSingle();
  return data ? mapSetup(data as DatabaseSetup) : undefined;
}
