import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { demoComponents } from "@/lib/demo-data";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!hasSupabaseEnv()) return NextResponse.json(demoComponents.filter((item) => `${item.brand} ${item.model}`.toLowerCase().includes(query.toLowerCase())).slice(0, 8));
  const supabase = await createClient();
  let requestBuilder = supabase.from("components").select("id, brand, model, category, origin, image_url").order("brand").limit(8);
  if (query) requestBuilder = requestBuilder.or(`brand.ilike.%${query}%,model.ilike.%${query}%`);
  const { data, error } = await requestBuilder;
  if (error) return NextResponse.json({ error: "Не вдалося знайти компоненти." }, { status: 500 });
  return NextResponse.json((data ?? []).map((item) => ({ id: item.id, brand: item.brand, model: item.model, category: item.category, origin: item.origin, imageUrl: item.image_url })));
}
