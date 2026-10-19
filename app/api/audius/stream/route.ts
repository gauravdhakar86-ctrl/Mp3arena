import { NextResponse } from "next/server";
import { isAuthed } from "../../../../lib/auth";

export async function GET(req: Request) {
  if (!(await isAuthed())) return new NextResponse("Login required", { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return new NextResponse("Missing id", { status: 400 });

  const url = new URL(`https://api.audius.co/v1/tracks/${encodeURIComponent(id)}/stream`);
  url.search = new URLSearchParams({ app_name: "MyMusic", no_redirect: "true" }).toString();

  const headers: Record<string, string> = {};
  if (process.env.AUDIUS_API_KEY) headers.Authorization = `Bearer ${process.env.AUDIUS_API_KEY}`;

  const res = await fetch(url, { headers, cache: "no-store" });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.data) return new NextResponse("Stream unavailable", { status: 502 });

  return NextResponse.redirect(data.data as string);
}
