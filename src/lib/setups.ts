import { getDemoSetup, demoSetups } from "@/lib/demo-data";
import { hasSupabaseEnv, coverUrl } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Category, ComponentOrigin, Setup, RoomDetails } from "@/lib/types";

type DatabaseComponent = { id: string; brand: string; model: string; category: string; origin: ComponentOrigin; image_url: string | null };
type DatabaseSetupComponent = { position: number; components: DatabaseComponent | DatabaseComponent[] | null };
type DatabaseSetup = { slug: string; title: string; city: string | null; description: string | null; cover_path: string | null; is_published?: boolean; profiles: { display_name: string | null } | { display_name: string | null }[] | null; setup_components: DatabaseSetupComponent[] | null; setup_categories: { categories: { name: string } | { name: string }[] | null }[] | null; setup_likes?: { count: number }[] | null };
type RpcComponent = { position: number; id: string; brand: string; model: string; category: string; origin: ComponentOrigin; image_url: string | null };
type RpcSetup = { slug: string; title: string; city: string | null; description: string | null; cover_path: string | null; is_published: boolean; owner_name: string | null; categories: string[]; components: RpcComponent[]; like_count: number; room_size: string | null; has_acoustic_treatment: boolean | null; acoustic_notes: string | null; listening_notes: string | null; budget_range: string | null };

export type SiteStats = { setups: number; users: number; components: number; addedThisWeek: number };

const palettes = [{ background: "#eceef3", wall: "#e2e5ee" }, { background: "#eef0f6", wall: "#e4e7f0" }, { background: "#f0eef6", wall: "#e7e3f2" }];
const selectSetup = "slug, title, city, description, cover_path, is_published, profiles(display_name), setup_components(position, components(id, brand, model, category, origin, image_url)), setup_categories(categories(name)), setup_likes(count)";

const emptyRoom: RoomDetails = { size: null, hasAcousticTreatment: null, acousticNotes: null, listeningNotes: null, budgetRange: null };

const mapComponents = (relations: DatabaseSetupComponent[] | null) => (relations ?? []).map((relation) => ({ position: relation.position, component: Array.isArray(relation.components) ? relation.components[0] : relation.components })).filter((relation): relation is { position: number; component: DatabaseComponent } => relation.component !== null && relation.component !== undefined).sort((a, b) => a.position - b.position);

const mapSetup = (row: DatabaseSetup, index = 0): Setup => {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const relations = mapComponents(row.setup_components);
  const categories = (row.setup_categories ?? []).map((entry) => Array.isArray(entry.categories) ? entry.categories[0]?.name : entry.categories?.name).filter((name): name is string => Boolean(name));
  return {
    slug: row.slug, title: row.title, location: row.city ?? "Україна",
    owner: profile?.display_name ?? "HiFiSetup listener",
    description: row.description ?? "Особистий простір для уважного слухання.",
    vibe: `${relations.length} компоненти`, palette: palettes[index % palettes.length],
    components: relations.map(({ component }) => ({ id: component.id, brand: component.brand, model: component.model, category: component.category, origin: component.origin, imageUrl: component.image_url })),
    coverUrl: coverUrl(row.cover_path), categories, isPublished: row.is_published ?? true,
    likeCount: row.setup_likes?.[0]?.count ?? 0, room: emptyRoom,
  };
};

const mapRpcSetup = (row: RpcSetup, index = 0): Setup => ({
  slug: row.slug, title: row.title, location: row.city ?? "Україна",
  owner: row.owner_name ?? "HiFiSetup listener",
  description: row.description ?? "Особистий простір для уважного слухання.",
  vibe: `${row.components.length} компоненти`, palette: palettes[index % palettes.length],
  components: row.components.map((component) => ({ id: component.id, brand: component.brand, model: component.model, category: component.category, origin: component.origin, imageUrl: component.image_url })),
  coverUrl: coverUrl(row.cover_path), categories: row.categories ?? [], isPublished: row.is_published,
  likeCount: row.like_count ?? 0,
  room: { size: row.room_size, hasAcousticTreatment: row.has_acoustic_treatment, acousticNotes: row.acoustic_notes, listeningNotes: row.listening_notes, budgetRange: row.budget_range },
});

export async function getPublishedSetups(): Promise<Setup[]> {
  if (!hasSupabaseEnv()) return demoSetups;
  const supabase = await createClient();
  const { data } = await supabase.from("setups").select(selectSetup).eq("is_published", true).order("created_at", { ascending: false });
  return data?.length ? (data as unknown as DatabaseSetup[]).map(mapSetup) : demoSetups;
}

/** Every setup owned by one user, private ones included — for their profile. */
export async function getSetupsByOwner(ownerId: string): Promise<Setup[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("setups").select(selectSetup).eq("owner_id", ownerId).order("created_at", { ascending: false });
  return (data as unknown as DatabaseSetup[] | null)?.map(mapSetup) ?? [];
}

export async function getSetup(slug: string): Promise<Setup | undefined> {
  // Older setups have percent-encoded Cyrillic slugs; decode so they still resolve.
  const decoded = (() => { try { return decodeURIComponent(slug); } catch { return slug; } })();
  if (!hasSupabaseEnv()) return getDemoSetup(decoded);
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_setup_detail", { p_slug: decoded });
  if (!data) return undefined;
  return mapRpcSetup(data as unknown as RpcSetup);
}

export async function getCategories(): Promise<Category[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("id, name, slug").order("sort_order");
  return data ?? [];
}

export async function getSiteStats(): Promise<SiteStats> {
  if (!hasSupabaseEnv()) return { setups: demoSetups.length, users: 0, components: 0, addedThisWeek: 0 };
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_site_stats");
  const stats = data as { setups: number; users: number; components: number; added_this_week: number } | null;
  return { setups: stats?.setups ?? 0, users: stats?.users ?? 0, components: stats?.components ?? 0, addedThisWeek: stats?.added_this_week ?? 0 };
}
