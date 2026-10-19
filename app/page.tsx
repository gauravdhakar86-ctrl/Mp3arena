"use client";
import { useEffect, useRef, useState } from "react";
import { Search, Home, Heart, Music, Play } from "lucide-react";

type Source = "yt" | "audius";
type Track = { id: string; title: string; artist: string; source: Source; thumb?: string };
type Filter = "all" | "audius" | "yt";

const HOME_TRACKS: Track[] = [
  { id: "5qap5aO4i9A", title: "Lofi Hip Hop Radio", artist: "Lofi Girl", source: "yt" },
  { id: "jfKfPfyJRdk", title: "Lofi Hip Hop - Beats to Relax/Study to", artist: "Lofi Girl", source: "yt" },
  { id: "4xDzrJKXOOY", title: "Synthwave Radio - Retro / Chill Beats", artist: "Synthwave Boy", source: "yt" },
];

const QUICK = ["Arijit Singh", "Bollywood lofi", "Punjabi hits", "Diljit Dosanjh", "Lofi hip hop"];

const same = (a: Track, b: Track) => a.id === b.id && a.source === b.source;
const thumbOf = (t: Track) => t.thumb || `https://img.youtube.com/vi/${t.id}/mqdefault.jpg`;

export default function MusicApp() {
  const [currentTrack, setCurrentTrack] = useState<Track>(HOME_TRACKS[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tracks, setTracks] = useState<Track[]>(HOME_TRACKS);
  const [heading, setHeading] = useState("Curated Library");
  const [liked, setLiked] = useState<Track[]>([]);
  const [activeTab, setActiveTab] = useState<"home" | "liked">("home");
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);

  const base = activeTab === "liked" ? liked : tracks;
  const displayList = filter === "all" ? base : base.filter((t) => t.source === filter);

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const selectTrack = (track: Track) => {
    setCurrentTrack(track);
    const a = audioRef.current;
    if (!a) return;
    if (track.source === "audius") {
      a.src = `/api/audius/stream?id=${encodeURIComponent(track.id)}`;
      a.play().catch(() => {});
    } else {
      a.pause();
    }
  };

  const step = (dir: 1 | -1) => {
    const i = displayList.findIndex((t) => same(t, currentTrack));
    const next = displayList[i + dir];
    if (next) selectTrack(next);
  };

  // Lock screen / notification controls for background tracks
  useEffect(() => {
    if (currentTrack.source !== "audius" || !("mediaSession" in navigator)) return;
    const a = audioRef.current;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: currentTrack.artist,
      artwork: currentTrack.thumb ? [{ src: currentTrack.thumb, sizes: "480x480", type: "image/jpeg" }] : [],
    });
    navigator.mediaSession.setActionHandler("play", () => { a?.play(); });
    navigator.mediaSession.setActionHandler("pause", () => { a?.pause(); });
    navigator.mediaSession.setActionHandler("nexttrack", () => step(1));
    navigator.mediaSession.setActionHandler("previoustrack", () => step(-1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack, displayList]);

  const runSearch = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    setActiveTab("home");

    const [yt, au] = await Promise.allSettled([
      fetch("/api/search?q=" + encodeURIComponent(query)).then((r) => r.json()),
      fetch("/api/audius?q=" + encodeURIComponent(query)).then((r) => r.json()),
    ]);

    const ytItems: Track[] =
      yt.status === "fulfilled" && Array.isArray(yt.value.items)
        ? yt.value.items.map((t: Omit<Track, "source">) => ({ ...t, source: "yt" as const }))
        : [];
    const auItems: Track[] =
      au.status === "fulfilled" && Array.isArray(au.value.items)
        ? au.value.items.map((t: Omit<Track, "source">) => ({ ...t, source: "audius" as const }))
        : [];

    if (!ytItems.length && !auItems.length) {
      const msg = yt.status === "fulfilled" && yt.value.error ? yt.value.error : "Koi result nahi mila";
      setError(msg);
    } else {
      const merged = [...auItems.slice(0, 6), ...ytItems.slice(0, 8), ...auItems.slice(6)];
      setTracks(merged);
      setFilter("all");
      setHeading(`Results for "${query}"`);
      selectTrack(merged[0]);
    }
    setLoading(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(searchQuery);
    setSearchQuery("");
  };

  const goHome = () => {
    setActiveTab("home");
    setTracks(HOME_TRACKS);
    setHeading("Curated Library");
    setFilter("all");
  };

  const toggleLike = (track: Track, e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked((prev) => (prev.some((t) => same(t, track)) ? prev.filter((t) => !same(t, track)) : [...prev, track]));
  };

  const navBtn = (active: boolean) =>
    `flex items-center gap-3 p-3 rounded-xl font-semibold transition ${
      active ? "bg-zinc-800 text-white" : "text-zinc-400 hover:text-white"
    }`;

  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-3 py-1 text-xs ${
      active ? "border-green-500 text-green-400" : "border-zinc-800 text-zinc-400"
    }`;

  return (
    <div className="flex h-[100dvh] bg-black text-white font-sans overflow-hidden">
      {/* SIDEBAR (laptop only) */}
      <aside className="hidden md:flex w-64 shrink-0 bg-zinc-950 p-6 flex-col gap-6 border-r border-zinc-900 overflow-y-auto">
        <h1 className="text-2xl font-extrabold text-green-500 flex items-center gap-2 tracking-tight">
          <Music size={28} /> My Music
        </h1>
        <nav className="flex flex-col gap-2">
          <button onClick={goHome} className={navBtn(activeTab === "home")}>
            <Home size={20} /> Home Hub
          </button>
          <button onClick={() => setActiveTab("liked")} className={navBtn(activeTab === "liked")}>
            <Heart size={20} className="text-green-500 fill-green-500" /> Liked Songs ({liked.length})
          </button>
          <a href="/reels" className={navBtn(false)}>
            <Play size={20} /> Reels
          </a>
          <button onClick={logout} className={navBtn(false)}>
            Logout
          </button>
        </nav>
        <div className="border-t border-zinc-800/80 pt-5">
          <p className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-3">Quick Searches</p>
          <div className="flex flex-col gap-1.5">
            {QUICK.map((q) => (
              <button key={q} onClick={() => runSearch(q)} className="text-left text-sm truncate py-1.5 px-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900/50">
                • {q}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex-1 overflow-y-auto overscroll-contain bg-gradient-to-b from-emerald-950/40 via-zinc-950 to-black px-4 pt-4 pb-24 md:p-8 md:pb-8">
          <div className="md:hidden mb-3 flex items-center justify-between">
            <h1 className="text-xl font-extrabold text-green-500 flex items-center gap-2">
              <Music size={22} /> My Music
            </h1>
            <div className="flex items-center gap-3 text-xs">
              <a href="/reels" className="text-green-400">Reels</a>
              <button onClick={logout} className="text-zinc-400">Logout</button>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex items-center gap-2 md:gap-3">
            <div className="relative flex-1 md:max-w-xl">
              <Search className="absolute left-4 top-3 text-zinc-400" size={18} />
              <input
                type="search"
                enterKeyHint="search"
                placeholder="Search song or artist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-full py-3 pl-11 pr-4 text-base md:text-sm text-white focus:outline-none focus:border-green-500"
              />
            </div>
            <button type="submit" className="bg-green-500 text-black font-bold px-4 md:px-6 py-3 rounded-full text-sm active:scale-95 transition flex items-center gap-2 shrink-0">
              <Play size={16} className="fill-black hidden sm:block" /> {loading ? "..." : "Search"}
            </button>
          </form>

          <div className="md:hidden -mx-4 mt-3 px-4 flex gap-2 overflow-x-auto no-scrollbar">
            {QUICK.map((q) => (
              <button key={q} onClick={() => runSearch(q)} className="shrink-0 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 active:bg-zinc-800">
                {q}
              </button>
            ))}
          </div>

          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

          {/* PLAYER */}
          <div className="sticky top-0 z-20 md:static -mx-4 px-4 md:mx-0 md:px-0 mt-4 pb-3 bg-black/95 md:bg-transparent backdrop-blur md:backdrop-blur-none">
            {currentTrack.source === "yt" && (
              <div className="rounded-2xl overflow-hidden border border-zinc-800 bg-black aspect-video w-full max-w-3xl">
                <iframe
                  key={currentTrack.id}
                  src={`https://www.youtube.com/embed/${currentTrack.id}?autoplay=1&playsinline=1&enablejsapi=1`}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="border-0 w-full h-full"
                />
              </div>
            )}

            {/* Audio element stays mounted so playback survives track changes */}
            <div className={currentTrack.source === "audius" ? "flex items-center gap-3 max-w-3xl rounded-2xl border border-zinc-800 bg-zinc-950 p-3" : "hidden"}>
              {currentTrack.thumb && <img src={currentTrack.thumb} alt="" className="h-16 w-16 rounded-lg object-cover shrink-0" />}
              <audio ref={audioRef} controls preload="auto" onEnded={() => step(1)} className="w-full min-w-0" />
            </div>

            <div className="mt-2 min-w-0">
              <span className="text-[10px] uppercase tracking-widest text-green-400 font-bold">
                Now Playing {currentTrack.source === "audius" ? "(background ready)" : "(video)"}
              </span>
              <h2 className="text-base md:text-2xl font-extrabold truncate">{currentTrack.title}</h2>
              <p className="text-zinc-400 text-xs md:text-sm truncate">{currentTrack.artist}</p>
            </div>
          </div>

          <h3 className="text-lg md:text-xl font-bold mt-4 mb-2">{activeTab === "liked" ? "Your Liked Tracks" : heading}</h3>

          <div className="flex gap-2 mb-3">
            <button onClick={() => setFilter("all")} className={chip(filter === "all")}>All</button>
            <button onClick={() => setFilter("audius")} className={chip(filter === "audius")}>Background</button>
            <button onClick={() => setFilter("yt")} className={chip(filter === "yt")}>Video</button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {displayList.map((track) => {
              const isPlaying = same(currentTrack, track);
              const isLiked = liked.some((t) => same(t, track));
              return (
                <div
                  key={`${track.source}:${track.id}`}
                  onClick={() => { selectTrack(track); window.scrollTo({ top: 0 }); }}
                  className={`p-2 md:p-4 rounded-xl transition cursor-pointer active:scale-[0.98] ${
                    isPlaying ? "bg-zinc-800 border border-green-500/50" : "bg-zinc-900/60 md:hover:bg-zinc-800"
                  }`}
                >
                  <div className="relative aspect-video bg-zinc-900 rounded-lg mb-2 overflow-hidden">
                    <img src={thumbOf(track)} alt={track.title} loading="lazy" className="w-full h-full object-cover" />
                    <span className={`absolute left-1 top-1 rounded px-1.5 py-0.5 text-[10px] font-bold ${track.source === "audius" ? "bg-green-500 text-black" : "bg-black/70 text-zinc-200"}`}>
                      {track.source === "audius" ? "Background" : "Video"}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-1">
                    <div className="min-w-0">
                      <h4 className={`font-bold text-xs md:text-sm line-clamp-2 ${isPlaying ? "text-green-400" : "text-white"}`}>{track.title}</h4>
                      <p className="text-[11px] md:text-xs text-zinc-400 mt-0.5 truncate">{track.artist}</p>
                    </div>
                    <button onClick={(e) => toggleLike(track, e)} className="p-1 -mr-1 shrink-0" aria-label="Like">
                      <Heart size={18} className={isLiked ? "text-green-500 fill-green-500" : "text-zinc-500"} />
                    </button>
                  </div>
                </div>
              );
            })}
            {!displayList.length && <p className="text-sm text-zinc-500 col-span-full">Yahan abhi kuch nahi hai.</p>}
          </div>

          <p className="mt-6 text-[11px] text-zinc-600">Background tracks: Audius. Video tracks: YouTube.</p>
        </div>

        {/* BOTTOM TAB BAR (mobile only) */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 flex border-t border-zinc-800 bg-zinc-950/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
          <button onClick={goHome} className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs ${activeTab === "home" ? "text-green-400" : "text-zinc-400"}`}>
            <Home size={20} /> Home
          </button>
          <button onClick={() => setActiveTab("liked")} className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs ${activeTab === "liked" ? "text-green-400" : "text-zinc-400"}`}>
            <Heart size={20} /> Liked ({liked.length})
          </button>
        </nav>
      </div>
    </div>
  );
}
