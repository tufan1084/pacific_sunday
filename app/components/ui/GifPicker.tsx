"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { IoClose, IoSearchOutline } from "react-icons/io5";
import { api } from "@/app/services/api";
import type { GifResult } from "@/app/services/api";

interface GifPickerProps {
  isOpen: boolean;
  onClose: () => void;
  // Called once when the user picks a GIF. We hand back the fully-fetched
  // File (not just the URL) so the caller can plug it straight into an
  // existing file-upload pipeline.
  onSelect: (gif: { file: File; result: GifResult }) => void | Promise<void>;
}

const SEARCH_DEBOUNCE_MS = 350;

export default function GifPicker({ isOpen, onClose, onSelect }: GifPickerProps) {
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<GifResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [next, setNext] = useState<string | null>(null);
  const [picking, setPicking] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Tracks the latest query so a slow first request can't overwrite results
  // from a newer one when the user types fast.
  const requestSeq = useRef(0);

  const run = useCallback(async (q: string, append: boolean, cursor: string | null) => {
    const seq = ++requestSeq.current;
    if (append) setLoadingMore(true);
    else {
      setLoading(true);
      setError(null);
    }
    try {
      const res = q.trim()
        ? await api.gifs.search(q.trim(), cursor || undefined)
        : await api.gifs.featured(cursor || undefined);
      // Stale response — newer query has already run, drop this one.
      if (seq !== requestSeq.current) return;
      if (!res.success || !res.data) {
        setError(res.message || "Couldn't load GIFs");
        if (!append) setGifs([]);
        setNext(null);
        return;
      }
      setGifs((prev) => (append ? [...prev, ...res.data!.gifs] : res.data!.gifs));
      setNext(res.data.next || null);
    } catch (e) {
      if (seq !== requestSeq.current) return;
      setError(e instanceof Error ? e.message : "Couldn't load GIFs");
      if (!append) setGifs([]);
    } finally {
      if (seq === requestSeq.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, []);

  // Debounce search. When the picker is opened with an empty query, fire the
  // featured request immediately so the user sees something instantly.
  useEffect(() => {
    if (!isOpen) return;
    const delay = query.trim() ? SEARCH_DEBOUNCE_MS : 0;
    const t = setTimeout(() => run(query, false, null), delay);
    return () => clearTimeout(t);
  }, [isOpen, query, run]);

  // Reset state + autofocus search on open.
  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setGifs([]);
      setError(null);
      setNext(null);
      setPicking(null);
      return;
    }
    // Give the modal a frame to mount before focusing — otherwise iOS
    // sometimes ignores the focus and the soft keyboard doesn't appear.
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, [isOpen]);

  // Infinite scroll — when the grid nears the bottom, fetch the next page.
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || loading || loadingMore || !next) return;
    const remaining = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (remaining < 240) {
      run(query, true, next);
    }
  }, [loading, loadingMore, next, query, run]);

  const handlePick = async (g: GifResult) => {
    if (picking) return;
    setPicking(g.id);
    try {
      // Giphy's gif URLs are CDN-hosted with permissive CORS, so a direct
      // fetch from the browser works. The blob comes back as image/gif which
      // the post-upload pipeline already accepts.
      const res = await fetch(g.url);
      if (!res.ok) throw new Error("Failed to download GIF");
      const blob = await res.blob();
      const file = new File([blob], `giphy-${g.id}.gif`, { type: blob.type || "image/gif" });
      await onSelect({ file, result: g });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't load that GIF");
    } finally {
      setPicking(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.8)",
        zIndex: 10001,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        fontFamily: "var(--font-poppins), sans-serif",
      }}
      className="lg:p-5"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="lg:rounded-xl lg:max-w-[560px] lg:max-h-[80vh]"
        style={{
          backgroundColor: "#13192A",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "14px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <h3 style={{ color: "#E8C96A", fontSize: "16px", fontWeight: 600, margin: 0 }}>Pick a GIF</h3>
          <button
            onClick={onClose}
            aria-label="Close GIF picker"
            style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: "4px" }}
          >
            <IoClose size={22} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: "12px 18px", flexShrink: 0 }}>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
              backgroundColor: "#060D1F",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "8px",
              padding: "8px 12px",
              gap: "8px",
            }}
          >
            <IoSearchOutline size={18} color="#888" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search GIPHY..."
              // 16px to avoid iOS Safari auto-zooming on focus.
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                color: "#fff",
                fontSize: "16px",
                fontFamily: "inherit",
              }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                aria-label="Clear search"
                style={{ background: "none", border: "none", color: "#666", cursor: "pointer", padding: "2px", display: "flex" }}
              >
                <IoClose size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Grid */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "0 18px 18px",
            touchAction: "pan-y",
          }}
        >
          {loading && gifs.length === 0 ? (
            <div style={{ color: "#888", textAlign: "center", padding: "40px 0", fontSize: "13px" }}>
              Loading GIFs...
            </div>
          ) : error ? (
            <div style={{ color: "#EF4444", textAlign: "center", padding: "40px 0", fontSize: "13px" }}>
              {error}
            </div>
          ) : gifs.length === 0 ? (
            <div style={{ color: "#888", textAlign: "center", padding: "40px 0", fontSize: "13px" }}>
              No GIFs found
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "8px",
              }}
              className="sm:grid-cols-3"
            >
              {gifs.map((g) => {
                const isPicking = picking === g.id;
                return (
                  <button
                    key={g.id}
                    onClick={() => handlePick(g)}
                    disabled={isPicking || !!picking}
                    aria-label={g.title || "GIF"}
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
                      transition: "opacity 0.15s ease",
                    }}
                  >
                    {/* Use <img> not next/image — Tenor URLs are unknown remotes */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={g.preview}
                      alt={g.title || "GIF"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        display: "block",
                      }}
                      loading="lazy"
                    />
                    {isPicking && (
                      <div
                        style={{
                          position: "absolute",
                          inset: 0,
                          backgroundColor: "rgba(0,0,0,0.6)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#E8C96A",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        Adding...
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {loadingMore && (
            <div style={{ color: "#888", textAlign: "center", padding: "16px 0", fontSize: "12px" }}>
              Loading more...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
