import { NextResponse } from "next/server";
import { getCategories } from "@/lib/setups";

export const dynamic = "force-dynamic";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

export async function OPTIONS() { return new NextResponse(null, { status: 204, headers: cors }); }

export async function GET() {
  const categories = await getCategories();
  return NextResponse.json({ categories: categories.map(({ name, slug }) => ({ name, slug })) }, { headers: cors });
}
