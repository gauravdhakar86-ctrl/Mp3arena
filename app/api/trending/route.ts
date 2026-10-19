import { NextResponse } from "next/server";
import { isAuthed } from "../../../lib/auth";

type YTVideo = { id: string; snippet: { title: string; channelTitle: string }; status?: { embeddable?: boolean } };
type AudiusTrack = { id: string; title: string; user: { name: string }; artwork?: Record<string, string> | null };
type Item = { id: string; title: string; artist: string; source: "yt" | "audius"; thumb?: string };

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");

async function youtubeTrending(): Promise<Item[]> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return [];
  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.search = new URLSearchParams({
    part: "snippet,status",
    chart: "mostPopular",
    videoCategoryId: "10",
    regionCode: "IN",
    maxResults: "20",
    key,
  }).toString();
  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) return [];
  const data = await res.json();
  return ((data.items || []) as YTVideo[])
    .filter((v) => v.status?.embeddable !== false)
    .map((v) => ({ id: v.id, title: decode(v.snippet.title), artist: decode(v.snippet.channelTitle), source: "yt" as const }));
}

async function audiusTrending(): Promise<Item[]> {
  const url = new URL("https://api.audius.co/v1/tracks/trending");
  url.search = new URLSearchParams({ app_name: "MyMusic", limit: "20", time: "week" }).toString();
  const headers: Record<string, string> = {};
  if (process.env.AUDIUS_API_KEY) headers.Authorization = `Bearer ${process.env.AUDIUS_API_KEY}`;
  const res = await fetch(url, { headers, next: { revalidate: 1800 } });
  if (!res.ok) return [];
  const data = await res.json();
  return ((data.data || []) as AudiusTrack[]).map((t) => ({
    id: t.id,
    title: t.title,
    artist: t.user?.name || "Audius artist",
    source: "audius" as const,
    thumb: t.artwork?.["480x480"] || t.artwork?.["150x150"] || "",
  }));
}

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const [yt, au] = await Promise.allSettled([youtubeTrending(), audiusTrending()]);
  const a = yt.status === "fulfilled" ? yt.value : [];
  const b = au.status === "fulfilled" ? au.value : [];

  const items: Item[] = [];
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    if (a[i]) items.push(a[i]);
    if (b[i]) items.push(b[i]);
  }
  if (!items.length) return NextResponse.json({ error: "Trending load nahi hua (API key check kijiye)" }, { status: 502 });
  return NextResponse.json({ items });
}
