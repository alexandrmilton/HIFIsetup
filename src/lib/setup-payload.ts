import type { SupabaseClient } from "@supabase/supabase-js";
import type { AudioComponent, ComponentOrigin } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export type SetupPayload = {
  title?: string; location?: string; country?: string; description?: string; isPublished?: boolean;
  coverPath?: string | null; galleryPaths?: string[]; categoryIds?: string[]; components?: AudioComponent[]; extras?: AudioComponent[];
  roomSize?: string; hasAcousticTreatment?: boolean | null; acousticNotes?: string;
  listeningNotes?: string; budgetRange?: string;
};

const validOrigins = new Set<ComponentOrigin>(["standard", "handmade", "custom_order"]);
/** Five photos per setup in total: the cover plus four extras. */
export const MAX_GALLERY_IMAGES = 4;

export const setupColumns = (body: SetupPayload) => ({
  title: body.title!.trim(),
  city: body.location?.trim() || null,
  country: body.country?.trim() || null,
  description: body.description?.trim() || null,
  cover_path: body.coverPath || null,
  is_published: body.isPublished === true,
  room_size: body.roomSize?.trim() || null,
  has_acoustic_treatment: typeof body.hasAcousticTreatment === "boolean" ? body.hasAcousticTreatment : null,
  acoustic_notes: body.acousticNotes?.trim() || null,
  listening_notes: body.listeningNotes?.trim() || null,
  budget_range: body.budgetRange?.trim() || null,
});

export function validate(body: SetupPayload, t: Dictionary): string | null {
  if (!body.title?.trim()) return t.errors.titleRequired;
  if (!Array.isArray(body.components) || body.components.length === 0) return t.errors.componentRequired;
  return null;
}

/** Inserts any manually-entered components, then rewrites the setup's ordered
 *  component chain and category tags to match the payload exactly. */
export async function syncRelations(supabase: SupabaseClient, setupId: string, userId: string, body: SetupPayload, t: Dictionary): Promise<string | null> {
  // Manually entered components join the shared catalogue so it grows from use.
  // Uniqueness is case-insensitive now, so look up an existing row first rather
  // than relying on upsert's conflict target.
  async function resolveId(component: AudioComponent): Promise<string | null> {
    if (!component.id.startsWith("new-")) return component.id;
    const brand = component.brand?.trim();
    const model = component.model?.trim();
    if (!brand || !model || !validOrigins.has(component.origin)) return null;

    const { data: existing } = await supabase.from("components")
      .select("id").ilike("brand", brand).ilike("model", model).maybeSingle();
    if (existing) return existing.id;

    const { data, error } = await supabase.from("components")
      .insert({ brand, model, category: component.category || "Аксесуар", origin: component.origin, submitted_by: userId })
      .select("id").single();
    return error ? null : data.id;
  }

  const chainIds: string[] = [];
  for (const component of body.components ?? []) {
    const id = await resolveId(component);
    if (!id) return t.errors.customComponentFailed;
    chainIds.push(id);
  }

  const extraIds: string[] = [];
  for (const component of body.extras ?? []) {
    const id = await resolveId(component);
    if (!id) return t.errors.customComponentFailed;
    if (!chainIds.includes(id) && !extraIds.includes(id)) extraIds.push(id);
  }

  await supabase.from("setup_components").delete().eq("setup_id", setupId);
  const rows = [
    ...chainIds.map((componentId, position) => ({ setup_id: setupId, component_id: componentId, position, is_extra: false })),
    ...extraIds.map((componentId, index) => ({ setup_id: setupId, component_id: componentId, position: chainIds.length + index, is_extra: true })),
  ];
  const { error: relationError } = await supabase.from("setup_components").insert(rows);
  if (relationError) return t.errors.componentsSaveFailed;

  await supabase.from("setup_categories").delete().eq("setup_id", setupId);
  if (body.categoryIds?.length) {
    await supabase.from("setup_categories").insert(body.categoryIds.map((categoryId) => ({ setup_id: setupId, category_id: categoryId })));
  }

  // Extra photos are replaced wholesale, same as the component chain. The
  // cover itself lives on setups.cover_path and is never duplicated here.
  await supabase.from("setup_images").delete().eq("setup_id", setupId);
  const gallery = (body.galleryPaths ?? [])
    .map((path) => path?.trim())
    .filter((path): path is string => Boolean(path) && path !== body.coverPath)
    .slice(0, MAX_GALLERY_IMAGES);
  if (gallery.length) {
    const { error: imageError } = await supabase.from("setup_images")
      .insert(gallery.map((path, position) => ({ setup_id: setupId, path, position })));
    if (imageError) return t.errors.imagesSaveFailed;
  }
  return null;
}
