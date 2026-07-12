import { NextResponse } from "next/server";
import {
  getPublicProfileBySlugOrId,
  getPublicProfilePageData,
  toPublicProfileApiPayload,
} from "@/lib/profile-public-queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const profile = await getPublicProfileBySlugOrId(slug);
  if (!profile) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data = await getPublicProfilePageData(profile);
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(toPublicProfileApiPayload(data));
}
