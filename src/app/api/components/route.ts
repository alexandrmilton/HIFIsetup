import { NextResponse } from "next/server";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { demoComponents } from "@/lib/demo-data";
import { getDictionary } from "@/lib/i18n/server";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!hasSupabaseEnv()) {
    return NextResponse.json(demoComponents.filter((item) => `${item.brand} ${item.model}`.toLowerCase().includes(query.toLowerCase())).slice(0, 12));
  }

  const supabase = await createClient();
  // search_components ranks exact and prefix hits first. A plain
  // order(brand).limit(n) buried freshly added models behind big brands.
  const { data, error } = await supabase.rpc("search_components", { p_query: query, p_limit: 200 });
  if (error) {
    console.error("search_components", error);
    const t = await getDictionary();
    return NextResponse.json({ error: t.errors.searchFailed }, { status: 500 });
  }

  type Row = { id: string; brand: string; model: string; category: string; origin: string; image_url: string | null };
  return NextResponse.json((data as Row[] ?? []).map((item) => ({
    id: item.id, brand: item.brand, model: item.model, category: item.category, origin: item.origin, imageUrl: item.image_url,
  })));
}
