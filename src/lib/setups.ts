import { getDemoSetup, demoSetups } from "@/lib/demo-data";
import { hasSupabaseEnv, coverUrl } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Category, ComponentOrigin, Setup } from "@/lib/types";

type DatabaseComponent = { id: string; brand: string; model: string; category: string; origin: ComponentOrigin; image_url: string | null };
type DatabaseSetupComponent = { position: number; components: DatabaseComponent | DatabaseComponent[] | null };
type DatabaseSetup = { slug: string; title: string; city: string | null; description: string | null; cover_path: string | null; profiles: { display_name: string | null } | { display_name: string | null }[] | null; setup_components: DatabaseSetupComponent[] | null; setup_categories: { categories: { name: string } | { name: string }[] | null }[] | null };
type RpcComponent = { position: number; id: string; brand: string; model: string; category: string; origin: ComponentOrigin; image_url: string | null };
type RpcSetup = { slug: string; title: string; city: string | null; description: string | null; cover_path: string | null; is_published: boolean; owner_name: string | null; categories: string[]; components: RpcComponent[] };

const palettes = [{ background: "#dce4dc", wall: "#e9ddc6" }, { background: "#dce7e2", wall: "#cbd9d1" }, { background: "#e6ded1", wall: "#d8b798" }];
const selectSetup = "slug, title, city, description, cover_path, profiles(display_name), setup_components(position, components(id, brand, model, category, origin, image_url)), setup_categories(categories(name))";

const mapComponents = (relations: DatabaseSetupComponent[] | null) => (relations ?? []).map((relation) => ({ position: relation.position, component: Array.isArray(relation.components) ? relation.components[0] : relation.components })).filter((relation): relation is { position: number; component: DatabaseComponent } => relation.component !== null && relation.component !== undefined).sort((a, b) => a.position - b.position);

const mapSetup = (row: DatabaseSetup, index = 0): Setup => {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const relations = mapComponents(row.setup_components);
  const categories = (row.setup_categories ?? []).map((entry) => Array.isArray(entry.categories) ? entry.categories[0]?.name : entry.categories?.name).filter((name): name is string => Boolean(name));
  return { slug: row.slug, title: row.title, location: row.city ?? "Україна", owner: profile?.display_name ?? "HiFiSetup listener", description: row.description ?? "Особистий простір для уважного слухання.", vibe: `${relations.length} компоненти`, palette: palettes[index % palettes.length], components: relations.map(({ component }) => ({ id: component.id, brand: component.brand, model: component.model, category: component.category, origin: component.origin, imageUrl: component.image_url })), coverUrl: coverUrl(row.cover_path), categories, isPublished: true };
};

const mapRpcSetup = (row: RpcSetup, index = 0): Setup => ({ slug: row.slug, title: row.title, location: row.city ?? "Україна", owner: row.owner_name ?? "HiFiSetup listener", description: row.description ?? "Особистий простір для уважного слухання.", vibe: `${row.components.length} компоненти`, palette: palettes[index % palettes.length], components: row.components.map((component) => ({ id: component.id, brand: component.brand, model: component.model, category: component.category, origin: component.origin, imageUrl: component.image_url })), coverUrl: coverUrl(row.cover_path), categories: row.categories ?? [], isPublished: row.is_published });

export async function getPublishedSetups(): Promise<Setup[]> {
  if (!hasSupabaseEnv()) return demoSetups;
  const supabase = await createClient();
  const { data } = await supabase.from("setups").select(selectSetup).eq("is_published", true).order("created_at", { ascending: false });
  return data?.length ? (data as unknown as DatabaseSetup[]).map(mapSetup) : demoSetups;
}

export async function getSetup(slug: string): Promise<Setup | undefined> {
  if (!hasSupabaseEnv()) return getDemoSetup(slug);
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_setup_detail", { p_slug: slug });
  if (!data) return undefined;
  return mapRpcSetup(data as unknown as RpcSetup);
}

export async function getCategories(): Promise<Category[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("id, name, slug").order("sort_order");
  return data ?? [];
}
