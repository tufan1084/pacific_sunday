"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/app/services/api";
import type { GifResult } from "@/app/services/api";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  onSelectGif: (file: File) => void | Promise<void>;
}

type Tab = "emoji" | "gif";

// Curated emoji catalog — covers the categories WhatsApp shows, in roughly the
// same order. Kept hardcoded rather than pulled from a CDN to avoid an extra
// network dep just for the picker. Add more as needed.
const EMOJI_CATEGORIES: { name: string; icon: string; emojis: string[] }[] = [
  {
    name: "Smileys",
    icon: "😀",
    emojis: [
      "😀","😃","😄","😁","😆","😅","😂","🤣","🥲","😊","😇","🙂","🙃","😉","😌","😍","🥰","😘","😗","😙","😚","😋","😛","😝","😜","🤪","🤨","🧐","🤓","😎","🥳","🤩","🥺","😢","😭","😤","😠","😡","🤬","🤯","😳","🥵","🥶","😱","😨","😰","😥","😓","🤗","🤔","🤭","🤫","🤥","😶","😐","😑","😬","🙄","😯","😦","😧","😮","😲","🥱","😴","🤤","😪","😵","🤐","🥴","🤢","🤮","🤧","😷","🤒","🤕","🤑","🤠","💀","👻","👽","🤖","💩",
    ],
  },
  {
    name: "Gestures",
    icon: "👍",
    emojis: [
      "👍","👎","👌","✌️","🤞","🤟","🤘","🤙","👈","👉","👆","👇","☝️","✋","🤚","🖐️","🖖","👋","🤝","🙏","✍️","💅","🤳","💪","🦾","🦵","🦶","👂","🦻","👃","🧠","🫀","🫁","🦷","🦴","👀","👁️","👅","👄",
    ],
  },
  {
    name: "Hearts",
    icon: "❤️",
    emojis: [
      "❤️","🧡","💛","💚","💙","💜","🖤","🤍","🤎","💔","❣️","💕","💞","💓","💗","💖","💘","💝","💟",
    ],
  },
  {
    name: "Animals",
    icon: "🐶",
    emojis: [
      "🐶","🐱","🐭","🐹","🐰","🦊","🐻","🐼","🐨","🐯","🦁","🐮","🐷","🐸","🐵","🐔","🐧","🐦","🐤","🦆","🦅","🦉","🦇","🐺","🐗","🐴","🦄","🐝","🐛","🦋","🐌","🐞","🐢","🐍","🦎","🦖","🦕","🐙","🦑","🦐","🦞","🦀","🐡","🐠","🐟","🐬","🐳","🐋","🦈","🐊","🐅","🐆","🦓","🦒","🐘","🦏","🦛","🐪","🐫","🦘","🐃","🐂","🐄","🐎",
    ],
  },
  {
    name: "Food",
    icon: "🍕",
    emojis: [
      "🍏","🍎","🍐","🍊","🍋","🍌","🍉","🍇","🍓","🍈","🍒","🍑","🥭","🍍","🥥","🥝","🍅","🍆","🥑","🥦","🥬","🥒","🌶️","🌽","🥕","🥔","🍠","🥐","🍞","🥖","🥨","🧀","🥚","🍳","🥞","🥓","🥩","🍗","🍖","🌭","🍔","🍟","🍕","🥪","🥙","🌮","🌯","🥗","🍝","🍜","🍲","🍛","🍣","🍱","🥟","🍤","🍙","🍚","🍘","🍥","🥠","🍢","🍡","🍧","🍨","🍦","🥧","🎂","🍰","🧁","🍭","🍬","🍫","🍿","🍩","🍪","🌰","🥜","🍯",
    ],
  },
  {
    name: "Activities",
    icon: "⚽",
    emojis: [
      "⚽","🏀","🏈","⚾","🥎","🎾","🏐","🏉","🥏","🎱","🪀","🏓","🏸","🏒","🏑","🥍","🏏","⛳","🪁","🏹","🎣","🤿","🥊","🥋","🎽","🛹","🛷","⛸️","🥌","🎿","⛷️","🏂","🪂","🏋️","🤼","🤸","🤺","⛹️","🤾","🏌️","🏇","🧘","🏄","🏊","🤽","🚣","🧗","🚴","🚵","🎯","🎳","🎮","🎰","🎲","🧩","🎨","🎭","🎤","🎧","🎼","🎵","🎶",
    ],
  },
  {
    name: "Travel",
    icon: "✈️",
    emojis: [
      "🚗","🚕","🚙","🚌","🚎","🏎️","🚓","🚑","🚒","🚐","🚚","🚛","🚜","🛴","🚲","🛵","🏍️","🚨","🚔","🚍","🚖","🚡","🚠","🚟","🚃","🚋","🚞","🚝","🚄","🚅","🚈","🚂","🚆","🚇","🚊","🚉","✈️","🛫","🛬","🛩️","💺","🛰️","🚀","🛸","🚁","🛶","⛵","🚤","🛥️","🛳️","⛴️","🚢","⚓","⛽","🚧","🚦","🚥","🗺️","🗿","🗽","🗼","🏰","🏯","🏟️","🎡","🎢","🎠","⛲","⛱️","🏖️","🏝️","🏜️","🌋","⛰️","🏔️","🗻","🏕️","⛺","🏠","🏡","🏘️","🏚️","🏗️","🏭","🏢","🏬","🏣","🏤","🏥","🏦","🏨","🏪","🏫","🏩","💒","🏛️","⛪","🕌","🕍","🛕","🕋","⛩️",
    ],
  },
  {
    name: "Objects",
    icon: "💡",
    emojis: [
      "⌚","📱","📲","💻","⌨️","🖥️","🖨️","🖱️","🖲️","🕹️","🗜️","💽","💾","💿","📀","📼","📷","📸","📹","🎥","📽️","🎞️","📞","☎️","📟","📠","📺","📻","🎙️","🎚️","🎛️","🧭","⏱️","⏲️","⏰","🕰️","⌛","⏳","📡","🔋","🔌","💡","🔦","🕯️","🧯","🛢️","💸","💵","💴","💶","💷","💰","💳","💎","⚖️","🧰","🔧","🔨","⚒️","🛠️","⛏️","🔩","⚙️","🔫","💣","🔪","🗡️","⚔️","🛡️","🚬","⚰️","⚱️","🏺","🔮","📿","💈","⚗️","🔭","🔬","🕳️","💊","💉","🩸","🩹","🩺",
    ],
  },
  {
    name: "Symbols",
    icon: "🔣",
    emojis: [
      "💯","💢","💥","💫","💦","💨","🕳️","💬","🗨️","🗯️","💭","💤","⭐","🌟","✨","⚡","☄️","🔥","🌪️","🌈","☀️","🌤️","⛅","🌥️","☁️","🌦️","🌧️","⛈️","🌩️","🌨️","❄️","☃️","⛄","🌬️","💧","🌊","☔","☂️","🎶","🎵","✅","❌","⭕","🔴","🟠","🟡","🟢","🔵","🟣","🟤","⚫","⚪","🟥","🟧","🟨","🟩","🟦","🟪","🟫","⬛","⬜","◼️","◻️","◾","◽","▪️","▫️","🔶","🔷","🔸","🔹","🔺","🔻","💠","🔘","🔳","🔲","♻️","⚠️","🚸","🔱","⚜️","🔰","♾️","♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓","⛎",
    ],
  },
  {
    name: "Flags",
    icon: "🏁",
    emojis: [
      "🏳️","🏴","🏁","🚩","🏳️‍🌈","🏴‍☠️","🇺🇸","🇬🇧","🇨🇦","🇦🇺","🇩🇪","🇫🇷","🇪🇸","🇮🇹","🇯🇵","🇰🇷","🇨🇳","🇮🇳","🇧🇷","🇲🇽","🇿🇦","🇪🇬","🇦🇪","🇸🇦","🇮🇱","🇹🇷","🇷🇺","🇺🇦","🇵🇰","🇧🇩","🇱🇰","🇳🇵","🇸🇬","🇲🇾","🇮🇩","🇹🇭","🇻🇳","🇵🇭","🇳🇿","🇦🇷","🇨🇱","🇨🇴","🇵🇪","🇻🇪","🇳🇬","🇰🇪","🇪🇹","🇲🇦","🇩🇿","🇶🇦","🇮🇪","🇵🇹","🇳🇱","🇧🇪","🇸🇪","🇳🇴","🇩🇰","🇫🇮","🇨🇭","🇦🇹","🇵🇱","🇨🇿","🇭🇺","🇬🇷",
    ],
  },
];

const GIF_SEARCH_DEBOUNCE_MS = 350;

export default function EmojiGifPicker({ isOpen, onClose, onSelectEmoji, onSelectGif }: Props) {
  const [tab, setTab] = useState<Tab>("emoji");
  // Drives the layout switch: floating popover on desktop, full-width
  // bottom-anchored sheet on mobile (WhatsApp behaviour). 768px matches the
  // isMobile breakpoint used in MessagesContent.
  const [isMobile, setIsMobile] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // GIF state
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [next, setNext] = useState<string | null>(null);
  const [picking, setPicking] = useState<string | null>(null);
  const [gifError, setGifError] = useState<string | null>(null);
  const gifScrollRef = useRef<HTMLDivElement>(null);
  const gifSearchInputRef = useRef<HTMLInputElement>(null);
  const reqSeq = useRef(0);

  // Close on click outside or Escape.
  useEffect(() => {
    if (!isOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [isOpen, onClose]);

  // Track viewport so the picker can switch between popover and bottom sheet
  // without a hard refresh (device toolbar / rotation).
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Fetch GIFs (debounced search, or featured when query is empty).
  const fetchGifs = useCallback(async (q: string, append: boolean, cursor: string | null) => {
    const seq = ++reqSeq.current;
    if (append) setLoadingMore(true);
    else { setLoading(true); setGifError(null); }
    try {
      const res = q.trim()
        ? await api.gifs.search(q.trim(), cursor || undefined)
        : await api.gifs.featured(cursor || undefined);
      if (seq !== reqSeq.current) return;
      if (!res.success || !res.data) {
        setGifError(res.message || "Couldn't load GIFs");
        if (!append) setGifs([]);
        setNext(null);
        return;
      }
      setGifs((prev) => (append ? [...prev, ...res.data!.gifs] : res.data!.gifs));
      setNext(res.data.next || null);
    } catch (e) {
      if (seq !== reqSeq.current) return;
      setGifError(e instanceof Error ? e.message : "Couldn't load GIFs");
      if (!append) setGifs([]);
    } finally {
      if (seq === reqSeq.current) { setLoading(false); setLoadingMore(false); }
    }
  }, []);

  // Trigger initial GIF load + re-load on query change, only while on the GIF tab.
  useEffect(() => {
    if (!isOpen || tab !== "gif") return;
    const delay = query.trim() ? GIF_SEARCH_DEBOUNCE_MS : 0;
    const t = setTimeout(() => fetchGifs(query, false, null), delay);
    return () => clearTimeout(t);
  }, [isOpen, tab, query, fetchGifs]);

  const handleGifScroll = useCallback(() => {
    const el = gifScrollRef.current;
    if (!el || loading || loadingMore || !next) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < 200) {
      fetchGifs(query, true, next);
    }
  }, [loading, loadingMore, next, query, fetchGifs]);

  const handlePickGif = async (g: GifResult) => {
    if (picking) return;
    setPicking(g.id);
    try {
      const res = await fetch(g.url);
      if (!res.ok) throw new Error("Failed to download GIF");
      const blob = await res.blob();
      const file = new File([blob], `giphy-${g.id}.gif`, { type: blob.type || "image/gif" });
      await onSelectGif(file);
      onClose();
    } catch (e) {
      setGifError(e instanceof Error ? e.message : "Couldn't load that GIF");
    } finally {
      setPicking(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="shadow-2xl"
      style={{
        position: "absolute",
        // Anchored above the whole input bar (the parent is the input bar
        // root, not the small emoji button) so it can span the full width.
        bottom: "100%",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0F1629",
        ...(isMobile
          ? {
              // Mobile: edge-to-edge sheet sitting flush on top of the input
              // bar — exactly how WhatsApp shows it. No side gaps, only the
              // top corners rounded.
              left: 0,
              right: 0,
              width: "100%",
              height: "min(58vh, 380px)",
              maxHeight: "65vh",
              borderTop: "1px solid rgba(232, 201, 106, 0.2)",
              borderLeft: "1px solid rgba(232, 201, 106, 0.2)",
              borderRight: "1px solid rgba(232, 201, 106, 0.2)",
              borderRadius: "16px 16px 0 0",
            }
          : {
              // Desktop: compact floating popover, left-aligned to the input
              // bar, capped so it never exceeds the viewport.
              left: 0,
              width: "min(380px, calc(100vw - 16px))",
              height: "min(360px, 60vh)",
              maxHeight: "60vh",
              marginBottom: "8px",
              border: "1px solid rgba(232, 201, 106, 0.2)",
              borderRadius: "16px",
            }),
      }}
    >
      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid rgba(232, 201, 106, 0.12)",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setTab("emoji")}
          className="flex-1 py-2.5 text-xs font-semibold transition-colors"
          style={{
            color: tab === "emoji" ? "#E8C96A" : "#6B7280",
            borderBottom: tab === "emoji" ? "2px solid #E8C96A" : "2px solid transparent",
            background: "transparent",
          }}
        >
          EMOJI
        </button>
        <button
          onClick={() => setTab("gif")}
          className="flex-1 py-2.5 text-xs font-semibold transition-colors"
          style={{
            color: tab === "gif" ? "#E8C96A" : "#6B7280",
            borderBottom: tab === "gif" ? "2px solid #E8C96A" : "2px solid transparent",
            background: "transparent",
          }}
        >
          GIF
        </button>
      </div>

      {/* Tab content */}
      {tab === "emoji" ? (
        <EmojiTab onPick={onSelectEmoji} />
      ) : (
        <GifTab
          query={query}
          onQuery={setQuery}
          gifs={gifs}
          loading={loading}
          loadingMore={loadingMore}
          error={gifError}
          picking={picking}
          onPick={handlePickGif}
          scrollRef={gifScrollRef}
          onScroll={handleGifScroll}
          inputRef={gifSearchInputRef}
        />
      )}
    </div>
  );
}

function EmojiTab({ onPick }: { onPick: (emoji: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [activeCategory, setActiveCategory] = useState(EMOJI_CATEGORIES[0].name);

  const jumpTo = (name: string) => {
    const scroller = scrollRef.current;
    const section = sectionRefs.current[name];
    if (!scroller || !section) return;
    // Don't use scrollIntoView — it walks up the DOM and scrolls every
    // scrollable ancestor it finds, which pushes the chat input down and
    // leaves a gap at the bottom. Compute the offset relative to the
    // scroller and drive scrollTop directly so only this grid moves.
    const offset = section.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
    scroller.scrollTop = offset;
    setActiveCategory(name);
  };

  // Update active category as the user scrolls.
  const handleScroll = () => {
    const scroller = scrollRef.current;
    if (!scroller) return;
    const scrollerTop = scroller.getBoundingClientRect().top;
    for (const cat of EMOJI_CATEGORIES) {
      const node = sectionRefs.current[cat.name];
      if (!node) continue;
      const rect = node.getBoundingClientRect();
      if (rect.bottom - scrollerTop > 10) {
        setActiveCategory(cat.name);
        break;
      }
    }
  };

  return (
    <>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{ flex: 1, overflowY: "auto", padding: "8px 8px 4px" }}
      >
        {EMOJI_CATEGORIES.map((cat) => (
          <div
            key={cat.name}
            ref={(el) => { sectionRefs.current[cat.name] = el; }}
          >
            <div
              className="px-1 pt-1 pb-1 text-[10px] uppercase tracking-wide font-semibold"
              style={{ color: "#6B7280" }}
            >
              {cat.name}
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(8, 1fr)",
                gap: "2px",
              }}
            >
              {cat.emojis.map((emoji, i) => (
                <button
                  key={`${cat.name}-${i}`}
                  onClick={() => onPick(emoji)}
                  className="rounded hover:bg-white/10 transition"
                  style={{
                    fontSize: "22px",
                    lineHeight: "1",
                    padding: "6px 0",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                  }}
                  aria-label={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Category icon strip */}
      <div
        className="flex justify-around items-center"
        style={{
          borderTop: "1px solid rgba(232, 201, 106, 0.12)",
          padding: "4px 6px",
          flexShrink: 0,
        }}
      >
        {EMOJI_CATEGORIES.map((cat) => (
          <button
            key={cat.name}
            onClick={() => jumpTo(cat.name)}
            className="rounded-full transition"
            style={{
              fontSize: "16px",
              padding: "4px 6px",
              background: activeCategory === cat.name ? "rgba(232, 201, 106, 0.15)" : "transparent",
              border: "none",
              cursor: "pointer",
              opacity: activeCategory === cat.name ? 1 : 0.55,
            }}
            aria-label={cat.name}
            title={cat.name}
          >
            {cat.icon}
          </button>
        ))}
      </div>
    </>
  );
}

function GifTab({
  query, onQuery, gifs, loading, loadingMore, error, picking, onPick, scrollRef, onScroll, inputRef,
}: {
  query: string;
  onQuery: (q: string) => void;
  gifs: GifResult[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  picking: string | null;
  onPick: (g: GifResult) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <>
      <div style={{ padding: "8px 10px", flexShrink: 0 }}>
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder="Search GIFs..."
          style={{
            width: "100%",
            padding: "7px 12px",
            borderRadius: "8px",
            background: "#060D1F",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#E8E8E8",
            outline: "none",
            fontSize: "13px",
          }}
        />
      </div>
      <div
        ref={scrollRef}
        onScroll={onScroll}
        style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "0 10px 10px" }}
      >
        {loading && gifs.length === 0 ? (
          <div style={{ color: "#6B7280", textAlign: "center", padding: "32px 0", fontSize: "12px" }}>
            Loading GIFs...
          </div>
        ) : error ? (
          <div style={{ color: "#EF4444", textAlign: "center", padding: "32px 0", fontSize: "12px" }}>
            {error}
          </div>
        ) : gifs.length === 0 ? (
          <div style={{ color: "#6B7280", textAlign: "center", padding: "32px 0", fontSize: "12px" }}>
            No GIFs found
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "6px",
            }}
          >
            {gifs.map((g) => {
              const isPicking = picking === g.id;
              return (
                <button
                  key={g.id}
                  onClick={() => onPick(g)}
                  disabled={isPicking || !!picking}
                  style={{
                    position: "relative",
                    padding: 0,
                    border: "none",
                    background: "#060D1F",
                    borderRadius: "6px",
                    overflow: "hidden",
                    cursor: picking ? "wait" : "pointer",
                    opacity: picking && !isPicking ? 0.4 : 1,
                    aspectRatio: g.width && g.height ? `${g.width} / ${g.height}` : "1 / 1",
                  }}
                  aria-label={g.title || "GIF"}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={g.preview}
                    alt={g.title || "GIF"}
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    loading="lazy"
                  />
                  {isPicking && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.55)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#E8C96A",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}
                    >
                      Sending...
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
        {loadingMore && (
          <div style={{ color: "#6B7280", textAlign: "center", padding: "10px 0", fontSize: "11px" }}>
            Loading more...
          </div>
        )}
      </div>

    </>
  );
}
