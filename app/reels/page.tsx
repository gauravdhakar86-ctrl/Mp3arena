"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

type Track = { id: string; title: string; artist: string; source: "yt" | "audius"; thumb?: string };

const thumbOf = (t: Track) => t.thumb || `https://img.youtube.com/vi/${t.id}/hqdefault.jpg`;

export default function Reels() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [active, setActive] = useState(0);
  const [started, setStarted] = useState(false);
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(0);
  const tracksRef = useRef<Track[]>([]);
  activeRef.current = active;
  tracksRef.current = tracks;

  useEffect(() => {
    setOrigin(window.location.origin);
    fetch("/api/trending")
      .then((r) => r.json())
      .then((d) => (d.items ? setTracks(d.items) : setError(d.error || "Load nahi hua")))
      .catch(() => setError("Internet ya server ki dikkat"));
  }, []);

  const goNext = useCallback(() => {
    const el = listRef.current?.children[activeRef.current + 1] as HTMLElement | undefined;
    el?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Which card is on screen
  useEffect(() => {
    const root = listRef.current;
    if (!root || !tracks.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.idx));
        });
      },
      { root, threshold: 0.6 }
    );
    Array.from(root.children).forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [tracks]);

  // Play the active track
  useEffect(() => {
    const a = audioRef.current;
    const t = tracks[active];
    if (!a || !t || !started) return;
    if (t.source === "audius") {
      a.src = `/api/audius/stream?id=${encodeURIComponent(t.id)}`;
      a.play().catch(() => {});
    } else {
      a.pause();
    }
    if ("mediaSession" in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: t.title,
        artist: t.artist,
        artwork: t.thumb ? [{ src: t.thumb, sizes: "480x480", type: "image/jpeg" }] : [],
      });
      navigator.mediaSession.setActionHandler("play", () => { a.play(); });
      navigator.mediaSession.setActionHandler("pause", () => { a.pause(); });
      navigator.mediaSession.setActionHandler("nexttrack", goNext);
    }
  }, [active, started, tracks, goNext]);

  // YouTube "ended" -> next reel
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (!e.origin.includes("youtube.com")) return;
      try {
        const d = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        const state = d?.event === "onStateChange" ? d.info : d?.info?.playerState;
        if (state === 0) goNext();
      } catch {}
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [goNext]);

  return (
    <div className="relative h-[100dvh] bg-black text-white overflow-hidden">
      <audio ref={audioRef} onEnded={goNext} preload="auto" />

      <Link href="/" className="absolute left-4 top-4 z-30 rounded-full bg-black/60 px-3 py-1.5 text-xs backdrop-blur">
        Back
      </Link>
      <span className="absolute right-4 top-4 z-30 rounded-full bg-green-500 px-3 py-1.5 text-xs font-bold text-black">
        Trending
      </span>

      {!tracks.length && (
        <div className="flex h-full items-center justify-center px-6 text-center text-sm text-zinc-400">
          {error || "Trending gaane load ho rahe hain..."}
        </div>
      )}

      {tracks.length > 0 && !started && (
        <button
          onClick={() => setStarted(true)}
          className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-black/85 backdrop-blur"
        >
          <span className="rounded-full bg-green-500 px-8 py-3 text-lg font-bold text-black">Tap to start</span>
          <span className="text-xs text-zinc-400">Phir upar swipe karte rahiye</span>
        </button>
      )}

      <div ref={listRef} className="h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain no-scrollbar">
        {tracks.map((t, i) => {
          const isActive = i === active && started;
          return (
            <section key={`${t.source}:${t.id}`} data-idx={i} className="relative h-[100dvh] snap-start snap-always overflow-hidden">
              <img src={thumbOf(t)} alt="" className="absolute inset-0 h-full w-full scale-110 object-cover opacity-30 blur-2xl" />
              <div className="relative z-10 flex h-full flex-col items-center justify-center gap-5 px-4 pb-24 pt-16">
                {t.source === "yt" && isActive ? (
                  <div className="aspect-video w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-800 bg-black">
                    <iframe
                      src={`https://www.youtube.com/embed/${t.id}?autoplay=1&playsinline=1&enablejsapi=1&rel=0&origin=${encodeURIComponent(origin)}`}
                      allow="autoplay; encrypted-media; picture-in-picture"
                      allowFullScreen
                      className="h-full w-full border-0"
                      onLoad={(e) =>
                        e.currentTarget.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*")
                      }
                    />
                  </div>
                ) : (
                  <img src={thumbOf(t)} alt={t.title} className="aspect-square w-64 max-w-[70vw] rounded-2xl object-cover shadow-2xl sm:w-80" />
                )}

                <div className="w-full max-w-2xl text-center">
                  <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${t.source === "audius" ? "bg-green-500 text-black" : "bg-zinc-800 text-zinc-200"}`}>
                    {t.source === "audius" ? "Background ready" : "Video"}
                  </span>
                  <h2 className="mt-2 line-clamp-2 text-xl font-extrabold">{t.title}</h2>
                  <p className="mt-1 truncate text-sm text-zinc-400">{t.artist}</p>
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
