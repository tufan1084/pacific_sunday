"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";

const TRIGGER_THRESHOLD = 70;
const MAX_PULL = 110;
const PULL_RESISTANCE = 0.5;

/**
 * Touch pull-to-refresh for mobile. Attaches to the AppShell's `.main-content`
 * scroller so it works on every page that uses the app shell. Pages call this
 * hook with their own refresh callback (typically `refresh` from usePageData)
 * and render the returned `indicator` somewhere in their tree.
 *
 * Why not auto-portal? React requires a parent to host portals. Rendering the
 * indicator from the page keeps the hook tree-side-effect-free during SSR.
 */
export function usePullToRefresh(onRefresh: () => void | Promise<void>) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const stateRef = useRef({ startY: 0, distance: 0, isPulling: false, refreshing: false });
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const scroller = document.querySelector<HTMLElement>(".main-content");
    if (!scroller) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (scroller.scrollTop > 5 || stateRef.current.refreshing) return;
      stateRef.current.startY = e.touches[0].clientY;
      stateRef.current.isPulling = true;
      stateRef.current.distance = 0;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!stateRef.current.isPulling || stateRef.current.refreshing) return;
      const delta = e.touches[0].clientY - stateRef.current.startY;
      if (delta <= 0) {
        if (stateRef.current.distance !== 0) {
          stateRef.current.distance = 0;
          setPullDistance(0);
        }
        return;
      }
      // Rubber-band: harder to pull the further you go.
      const pulled = Math.min(delta * PULL_RESISTANCE, MAX_PULL);
      stateRef.current.distance = pulled;
      setPullDistance(pulled);
      // Block native scroll while pulling so iOS doesn't fight us.
      if (delta > 10 && scroller.scrollTop <= 0) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = async () => {
      if (!stateRef.current.isPulling) return;
      stateRef.current.isPulling = false;
      const distance = stateRef.current.distance;
      stateRef.current.distance = 0;

      if (distance >= TRIGGER_THRESHOLD) {
        stateRef.current.refreshing = true;
        setRefreshing(true);
        setPullDistance(50); // park the spinner at a comfortable height
        try {
          await onRefreshRef.current();
        } catch {
          // swallow — UX shouldn't trap on a failing refresh
        }
        stateRef.current.refreshing = false;
        setRefreshing(false);
        setPullDistance(0);
      } else {
        setPullDistance(0);
      }
    };

    scroller.addEventListener("touchstart", handleTouchStart, { passive: true });
    scroller.addEventListener("touchmove", handleTouchMove, { passive: false });
    scroller.addEventListener("touchend", handleTouchEnd);
    scroller.addEventListener("touchcancel", handleTouchEnd);

    return () => {
      scroller.removeEventListener("touchstart", handleTouchStart);
      scroller.removeEventListener("touchmove", handleTouchMove);
      scroller.removeEventListener("touchend", handleTouchEnd);
      scroller.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  // The visual indicator. Portalled to body so it overlays the header on every
  // page without the caller having to think about z-index or positioning.
  const indicator = useMemo(() => {
    if (!mounted) return null;
    if (pullDistance <= 0 && !refreshing) return null;
    const rotation = Math.min((pullDistance / TRIGGER_THRESHOLD) * 360, 360);
    return createPortal(
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 9999,
          transform: `translateY(${pullDistance - 30}px)`,
          transition: refreshing ? "transform 0.2s ease" : pullDistance === 0 ? "transform 0.25s ease" : "none",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            backgroundColor: "#13192A",
            border: "1px solid rgba(232,201,106,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              border: "2px solid rgba(232,201,106,0.25)",
              borderTopColor: "#E8C96A",
              transform: refreshing ? undefined : `rotate(${rotation}deg)`,
              animation: refreshing ? "ps-pull-spin 0.8s linear infinite" : "none",
            }}
          />
        </div>
        <style>{`@keyframes ps-pull-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>,
      document.body,
    );
  }, [mounted, pullDistance, refreshing]);

  return { indicator, refreshing, pullDistance };
}
