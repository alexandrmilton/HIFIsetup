import type { SupabaseClient } from "@supabase/supabase-js";
import type { AudioComponent, ComponentOrigin } from "@/lib/types";

export type SetupPayload = {
  title?: string; location?: string; description?: string; isPublished?: boolean;
  coverPath?: string | null; categoryIds?: string[]; components?: AudioComponent[];
  roomSize?: string; hasAcousticTreatment?: boolean | null; acousticNotes?: string;
  listeningNotes?: string; budgetRange?: string;
};

const validOrigins = new Set<ComponentOrigin>(["standard", "handmade", "custom_order"]);

export const setupColumns = (body: SetupPayload) => ({
  title: body.title!.trim(),
  city: body.location?.trim() || null,
  description: body.description?.trim() || null,
  cover_path: body.coverPath || null,
  is_published: body.isPublished === true,
  room_size: body.roomSize?.trim() || null,
  has_acoustic_treatment: typeof body.hasAcousticTreatment === "boolean" ? body.hasAcousticTreatment : null,
  acoustic_notes: body.acousticNotes?.trim() || null,
  listening_notes: body.listeningNotes?.trim() || null,
  budget_range: body.budgetRange?.trim() || null,
});

export function validate(body: SetupPayload): string | null {
  if (!body.title?.trim()) return "Вкажіть назву сетапу.";
  if (!Array.isArray(body.components) || body.components.length === 0) return "Додайте хоча б один компонент.";
  return null;
}

/** Inserts any manually-entered components, then rewrites the setup's ordered
 *  component chain and category tags to match the payload exactly. */
export async function syncRelations(supabase: SupabaseClient, setupId: string, userId: string, body: SetupPayload): Promise<string | null> {
  const componentIds: string[] = [];
  for (const component of body.components ?? []) {
    if (component.id.startsWith("new-") && component.brand?.trim() && component.model?.trim() && validOrigins.has(component.origin)) {
      const { data, error } = await supabase.from("components")
        .upsert({ brand: component.brand.trim(), model: component.model.trim(), category: component.category || "Інше", origin: component.origin, submitted_by: userId }, { onConflict: "brand,model" })
        .select("id").single();
      if (error || !data) return "Не вдалося додати власний компонент.";
      componentIds.push(data.id);
    } else componentIds.push(component.id);
  }

  await supabase.from("setup_components").delete().eq("setup_id", setupId);
  const { error: relationError } = await supabase.from("setup_components")
    .insert(componentIds.map((componentId, position) => ({ setup_id: setupId, component_id: componentId, position })));
  if (relationError) return "Не вдалося зберегти компоненти.";

  await supabase.from("setup_categories").delete().eq("setup_id", setupId);
  if (body.categoryIds?.length) {
    await supabase.from("setup_categories").insert(body.categoryIds.map((categoryId) => ({ setup_id: setupId, category_id: categoryId })));
  }
  return null;
}
