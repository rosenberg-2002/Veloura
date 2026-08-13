import { NextRequest, NextResponse } from "next/server";

const TMDB_API_BASE = "https://api.themoviedb.org/3";

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const expectedToken = process.env.TMDB_READ_ACCESS_TOKEN?.trim();
  const incomingToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();

  if (!expectedToken || incomingToken !== expectedToken) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { path } = await context.params;
  if (!path?.length || path.some((segment) => segment === ".." || segment.includes("/"))) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const url = new URL(`${TMDB_API_BASE}/${path.join("/")}`);
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${expectedToken}`,
    },
  });

  return new NextResponse(await response.text(), {
    status: response.status,
    headers: { "content-type": response.headers.get("content-type") ?? "application/json" },
  });
}
