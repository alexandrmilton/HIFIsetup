import { NextResponse } from "next/server";
import { getSetup } from "@/lib/setups";

export const dynamic = "force-dynamic";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: cors }); }

/** Full detail for one setup, including the ordered signal chain. Private
 *  setups resolve here too — the unguessable slug is the access token, same as
 *  opening the page directly. */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const setup = await getSetup(slug);
  if (!setup) return NextResponse.json({ error: "Setup not found." }, { status: 404, headers: cors });
  // Unmoderated content must not leak through the public API.
  if (setup.moderationStatus !== "approved") return NextResponse.json({ error: "Setup not available." }, { status: 404, headers: cors });

  const url = new URL(request.url);
  return NextResponse.json({
    slug: setup.slug,
    url: `${url.origin}/setups/${setup.slug}`,
    title: setup.title,
    owner: setup.owner,
    location: setup.location,
    description: setup.description,
    coverUrl: setup.coverUrl,
    categories: setup.categories,
    isPublished: setup.isPublished,
    likeCount: setup.likeCount,
    chain: setup.components.map((component, position) => ({
      position,
      id: component.id,
      brand: component.brand,
      model: component.model,
      category: component.category,
      origin: component.origin,
    })),
  }, { headers: cors });
}
