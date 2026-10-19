import { NextResponse } from "next/server";
import { isAuthed } from "../../../lib/auth";

type YTItem = { id: { videoId: string }; snippet: { title: string; channelTitle: string } };

const decode = (s: string) =>
  s.replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");

export async function GET(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Login required" }, { status: 401 });

  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ items: [] });

  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return NextResponse.json({ error: "YOUTUBE_API_KEY missing" }, { status: 500 });

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.search = new URLSearchParams({
    part: "snippet",
    type: "video",
    videoCategoryId: "10",
    videoEmbeddable: "true",
    maxResults: "10",
    q,
    key,
  }).toString();

  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data.error?.message || "YouTube search failed" }, { status: res.status });
  }

  const items = ((data.items || []) as YTItem[]).map((v) => ({
    id: v.id.videoId,
    title: decode(v.snippet.title),
    artist: decode(v.snippet.channelTitle),
  }));
  return NextResponse.json({ items });
}
