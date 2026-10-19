import { NextResponse } from "next/server";
import { isAuthed } from "../../../lib/auth";

type AudiusTrack = {
  id: string;
  title: string;
  user: { name: string };
  artwork?: Record<string, string> | null;
};

export async function GET(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ items: [] });

  const url = new URL("https://api.audius.co/v1/tracks/search");
  url.search = new URLSearchParams({ query: q, app_name: "MyMusic", limit: "12" }).toString();

  const headers: Record<string, string> = {};
  if (process.env.AUDIUS_API_KEY) headers.Authorization = `Bearer ${process.env.AUDIUS_API_KEY}`;

  const res = await fetch(url, { headers, cache: "no-store" });
  const data = await res.json();
  if (!res.ok) return NextResponse.json({ error: "Audius search failed" }, { status: res.status });

  const items = ((data.data || []) as AudiusTrack[]).map((t) => ({
    id: t.id,
    title: t.title,
    artist: t.user?.name || "Audius artist",
    thumb: t.artwork?.["480x480"] || t.artwork?.["150x150"] || "",
  }));
  return NextResponse.json({ items });
}
