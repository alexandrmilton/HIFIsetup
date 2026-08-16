import { getDemoSetup, demoSetups } from "@/lib/demo-data";
import { hasSupabaseEnv, coverUrl } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import type { Category, ComponentOrigin, ModerationStatus, Setup, RoomDetails } from "@/lib/types";

type DatabaseComponent = { id: string; brand: string; model: string; category: string; origin: ComponentOrigin; image_url: string | null };
type DatabaseSetupComponent = { position: number; is_extra?: boolean; components: DatabaseComponent | DatabaseComponent[] | null };
type DatabaseSetup = {
  slug: string; title: string; city: string | null; country?: string | null; description: string | null; cover_path: string | null;
  is_published?: boolean; moderation_status?: ModerationStatus; owner_id?: string | null;
  created_at?: string | null; updated_at?: string | null;
  room_size?: string | null; has_acoustic_treatment?: boolean | null; acoustic_notes?: string | null; listening_notes?: string | null; budget_range?: string | null;
  profiles: { display_name: string | null } | { display_name: string | null }[] | null;
  setup_components: DatabaseSetupComponent[] | null;
  setup_categories: { categories: { id: string; name: string } | { id: string; name: string }[] | null }[] | null;
  setup_likes?: { count: number }[] | null;
};
type RpcComponent = { position: number; is_extra?: boolean; id: string; brand: string; model: string; category: string; origin: ComponentOrigin; image_url: string | null };
type RpcComment = { id: string; body: string; created_at: string; author_id: string; author_name: string | null; author_avatar: string | null };
type RpcSetup = {
  slug: string; title: string; city: string | null; country: string | null; description: string | null; cover_path: string | null;
  is_published: boolean; moderation_status: ModerationStatus; owner_id: string | null; owner_name: string | null;
  categories: string[]; components: RpcComponent[]; comments: RpcComment[]; like_count: number;
  room_size: string | null; has_acoustic_treatment: boolean | null; acoustic_notes: string | null; listening_notes: string | null; budget_range: string | null;
  created_at: string | null; updated_at: string | null;
};

export type SiteStats = { setups: number; users: number; components: number; addedThisWeek: number };

const palettes = [{ background: "#eceef3", wall: "#e2e5ee" }, { background: "#eef0f6", wall: "#e4e7f0" }, { background: "#f0eef6", wall: "#e7e3f2" }];
// setup_likes gives PostgREST a second setups->profiles path, so the owner
// join must name its foreign key explicitly or the whole query 300s.
const selectSetup = "slug, title, city, country, description, cover_path, is_published, moderation_status, owner_id, created_at, updated_at, room_size, has_acoustic_treatment, acoustic_notes, listening_notes, budget_range, profiles!setups_owner_id_fkey(display_name), setup_components(position, is_extra, components(id, brand, model, category, origin, image_url)), setup_categories(categories(id, name)), setup_likes(count)";

const mapComponents = (relations: DatabaseSetupComponent[] | null) => (relations ?? []).map((relation) => ({ position: relation.position, isExtra: relation.is_extra ?? false, component: Array.isArray(relation.components) ? relation.components[0] : relation.components })).filter((relation): relation is { position: number; isExtra: boolean; component: DatabaseComponent } => relation.component !== null && relation.component !== undefined).sort((a, b) => Number(a.isExtra) - Number(b.isExtra) || a.position - b.position);

const mapSetup = (row: DatabaseSetup, index = 0): Setup => {
  const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
  const relations = mapComponents(row.setup_components);
  const categoryRows = (row.setup_categories ?? []).map((entry) => Array.isArray(entry.categories) ? entry.categories[0] : entry.categories).filter((category): category is { id: string; name: string } => Boolean(category));
  return {
    slug: row.slug, title: row.title, location: row.city ?? "—", country: row.country ?? null,
    owner: profile?.display_name ?? "HiFiSetup listener", ownerId: row.owner_id ?? null,
    description: row.description ?? "Особистий простір для уважного слухання.",
    vibe: `${relations.length} компоненти`, palette: palettes[index % palettes.length],
    components: relations.map(({ component, isExtra }) => ({ id: component.id, brand: component.brand, model: component.model, category: component.category, origin: component.origin, imageUrl: component.image_url, isExtra })),
    coverUrl: coverUrl(row.cover_path), coverPath: row.cover_path,
    categories: categoryRows.map((category) => category.name), categoryIds: categoryRows.map((category) => category.id),
    isPublished: row.is_published ?? true, moderationStatus: row.moderation_status ?? "approved",
    likeCount: row.setup_likes?.[0]?.count ?? 0,
    room: { size: row.room_size ?? null, hasAcousticTreatment: row.has_acoustic_treatment ?? null, acousticNotes: row.acoustic_notes ?? null, listeningNotes: row.listening_notes ?? null, budgetRange: row.budget_range ?? null },
    createdAt: row.created_at ?? null, updatedAt: row.updated_at ?? null, comments: [],
  };
};

const mapRpcSetup = (row: RpcSetup, index = 0): Setup => ({
  slug: row.slug, title: row.title, location: row.city ?? "—", country: row.country ?? null,
  owner: row.owner_name ?? "HiFiSetup listener", ownerId: row.owner_id,
  description: row.description ?? "Особистий простір для уважного слухання.",
  vibe: `${row.components.length} компоненти`, palette: palettes[index % palettes.length],
  components: row.components.map((component) => ({ id: component.id, brand: component.brand, model: component.model, category: component.category, origin: component.origin, imageUrl: component.image_url, isExtra: component.is_extra ?? false })),
  coverUrl: coverUrl(row.cover_path), coverPath: row.cover_path,
  categories: row.categories ?? [], categoryIds: [],
  isPublished: row.is_published, moderationStatus: row.moderation_status,
  likeCount: row.like_count ?? 0,
  room: { size: row.room_size, hasAcousticTreatment: row.has_acoustic_treatment, acousticNotes: row.acoustic_notes, listeningNotes: row.listening_notes, budgetRange: row.budget_range },
  createdAt: row.created_at, updatedAt: row.updated_at,
  comments: (row.comments ?? []).map((comment) => ({ id: comment.id, body: comment.body, createdAt: comment.created_at, authorId: comment.author_id, authorName: comment.author_name, authorAvatar: comment.author_avatar })),
});

/** Public feed: published AND approved by a moderator. */
export async function getPublishedSetups(): Promise<Setup[]> {
  if (!hasSupabaseEnv()) return demoSetups;
  const supabase = await createClient();
  const { data, error } = await supabase.from("setups").select(selectSetup)
    .eq("is_published", true).eq("moderation_status", "approved")
    .order("updated_at", { ascending: false });
  // Never fall back to demo rows once Supabase is configured: their slugs are
  // not in the database, so the cards would render but every click would 404.
  if (error) { console.error("getPublishedSetups", error); return []; }
  return (data as unknown as DatabaseSetup[]).map(mapSetup);
}

/** Every setup owned by one user — private and unmoderated ones included. */
export async function getSetupsByOwner(ownerId: string): Promise<Setup[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("setups").select(selectSetup).eq("owner_id", ownerId).order("updated_at", { ascending: false });
  if (error) { console.error("getSetupsByOwner", error); return []; }
  return (data as unknown as DatabaseSetup[]).map(mapSetup);
}

/** Moderation queue — admin only; RLS still applies to the caller. */
export async function getSetupsForModeration(): Promise<Setup[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("setups").select(selectSetup).order("created_at", { ascending: false });
  if (error) { console.error("getSetupsForModeration", error); return []; }
  return (data as unknown as DatabaseSetup[]).map(mapSetup);
}

export async function getSetup(slug: string): Promise<Setup | undefined> {
  // Older setups have percent-encoded Cyrillic slugs; decode so they still resolve.
  const decoded = (() => { try { return decodeURIComponent(slug); } catch { return slug; } })();
  if (!hasSupabaseEnv()) return getDemoSetup(decoded);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_setup_detail", { p_slug: decoded });
  if (error) { console.error("getSetup", error); return undefined; }
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
