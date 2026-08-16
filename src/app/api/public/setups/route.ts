import { NextResponse } from "next/server";
import { getPublishedSetups } from "@/lib/setups";

export const dynamic = "force-dynamic";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: cors }); }

/** Public read-only feed of published setups. Stable shape — consumed by the
 *  Telegram bot, so add fields rather than renaming existing ones. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const category = url.searchParams.get("category")?.trim();
  const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 100);
  const offset = Math.max(Number(url.searchParams.get("offset")) || 0, 0);

  const all = await getPublishedSetups();
  const matching = category ? all.filter((setup) => setup.categories.includes(category)) : all;
  const page = matching.slice(offset, offset + limit);

  return NextResponse.json({
    total: matching.length,
    limit,
    offset,
    setups: page.map((setup) => ({
      slug: setup.slug,
      url: `${url.origin}/setups/${setup.slug}`,
      title: setup.title,
      owner: setup.owner,
      location: setup.location,
      description: setup.description,
      coverUrl: setup.coverUrl,
      categories: setup.categories,
      componentCount: setup.components.length,
    })),
  }, { headers: cors });
}
