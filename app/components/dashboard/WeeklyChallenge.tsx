"use client";

import Image from "next/image";
import { useRef, useCallback } from "react";
import type { Challenge } from "@/app/types";

const TRIGGER_LABELS: Record<string, string> = {
  bag_registered:    "Bag Bonus",
  profile_completed: "Profile Bonus",
  h2h_won:           "H2H Bonus",
  reward_redeemed:   "Reward Bonus",
  nfc_tap_5x_month:  "Tap Bonus",
  referral:          "Referral Bonus",
};

interface WeeklyChallengeProps {
  challenge: Challenge;
  currentIndex?: number;
  totalChallenges?: number;
  onNext?: () => void;
  onPrev?: () => void;
  onGoTo?: (index: number) => void;
}

const SWIPE_THRESHOLD = 40;

export default function WeeklyChallenge({
  challenge,
  currentIndex = 0,
  totalChallenges = 1,
  onNext,
  onPrev,
  onGoTo,
}: WeeklyChallengeProps) {
  const progressPercent = typeof challenge.progress === "number" ? challenge.progress : 0;
  const isCompleted = challenge.status === "completed";
  const pointsLabel = challenge.triggerType ? TRIGGER_LABELS[challenge.triggerType] : null;

  // ── Swipe / drag ──────────────────────────────────────────────────────────
  const dragStart = useRef<number | null>(null);
  const handleDragEnd = useCallback((deltaX: number) => {
    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
    if (deltaX < 0) onNext?.(); else onPrev?.();
  }, [onNext, onPrev]);

  const onTouchStart = (e: React.TouchEvent) => { dragStart.current = e.touches[0].clientX; };
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (dragStart.current === null) return;
    handleDragEnd(e.changedTouches[0].clientX - dragStart.current);
    dragStart.current = null;
  };
  const onMouseDown = (e: React.MouseEvent) => { dragStart.current = e.clientX; };
  const onMouseUp   = (e: React.MouseEvent) => {
    if (dragStart.current === null) return;
    handleDragEnd(e.clientX - dragStart.current);
    dragStart.current = null;
  };

  const navControls = totalChallenges > 1 && (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <button
        onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
        disabled={currentIndex === 0}
        aria-label="Previous"
        style={{
          width: 22, height: 22, borderRadius: 4, padding: 0,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          color: currentIndex === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)",
          cursor: currentIndex === 0 ? "not-allowed" : "pointer",
          fontSize: 13, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >‹</button>
      <span style={{ fontSize: 11, color: "#888", minWidth: 28, textAlign: "center" }}>
        {currentIndex + 1}/{totalChallenges}
      </span>
      <button
        onClick={(e) => { e.stopPropagation(); onNext?.(); }}
        disabled={currentIndex === totalChallenges - 1}
        aria-label="Next"
        style={{
          width: 22, height: 22, borderRadius: 4, padding: 0,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          color: currentIndex === totalChallenges - 1 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.7)",
          cursor: currentIndex === totalChallenges - 1 ? "not-allowed" : "pointer",
          fontSize: 13, lineHeight: 1, display: "flex", alignItems: "center", justifyContent: "center",
        }}
      >›</button>
    </div>
  );

  return (
    <div
      style={{
        backgroundColor: "#13192A", borderRadius: "5px",
        margin: "16px 0", padding: "16px 12px 12px 12px",
        width: "100%", fontFamily: "var(--font-poppins), sans-serif",
        cursor: totalChallenges > 1 ? "grab" : "default",
        userSelect: "none", WebkitUserSelect: "none", position: "relative",
      }}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      onMouseDown={onMouseDown} onMouseUp={onMouseUp}
    >

      {/* ── MOBILE layout (hidden on sm+) ── */}
      <div className="flex flex-col gap-3 sm:hidden">
        {/* Top row: icon + title + nav */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          <Image src="/icons/weekly challenges.svg" alt="Weekly Challenge" width={24} height={24} style={{ flexShrink: 0, marginTop: 2 }} draggable={false} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
              <div style={{ fontSize: 15, color: "#E8C96A", fontWeight: 600, lineHeight: 1.3 }}>
                {challenge.title}
              </div>
              {navControls}
            </div>
          </div>
        </div>

        {/* Description */}
        <div style={{ fontSize: 13, color: "#FFFFFF", fontWeight: 400, lineHeight: 1.5 }}>
          {challenge.description}
        </div>

        {/* Badges */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {pointsLabel && (
            <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 999, background: "rgba(232,201,106,0.12)", border: "1px solid rgba(232,201,106,0.3)", color: "#E8C96A" }}>
              {pointsLabel}
            </span>
          )}
          {challenge.points !== undefined && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: isCompleted ? "rgba(74,222,128,0.12)" : "rgba(232,201,106,0.08)", border: `1px solid ${isCompleted ? "rgba(74,222,128,0.3)" : "rgba(232,201,106,0.2)"}`, color: isCompleted ? "#4ADE80" : "#E8C96A" }}>
              +{challenge.points} pts
            </span>
          )}
        </div>

        {/* Progress row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "#FFFFFF" }}>
            {typeof challenge.progress === "number" ? `${challenge.progress}%` : challenge.progress}
          </span>
          <span style={{ fontSize: 12, color: isCompleted ? "#4ADE80" : "#E8C96A", fontWeight: 400 }}>
            {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ width: "100%", backgroundColor: "#01040B", borderRadius: 999, height: 6, overflow: "hidden" }}>
          <div style={{ backgroundColor: isCompleted ? "#4ADE80" : "#E8C96A", height: 6, borderRadius: 999, width: `${progressPercent}%`, transition: "width 0.5s ease-in-out" }} />
        </div>
      </div>

      {/* ── DESKTOP layout (hidden on mobile) ── */}
      <div className="hidden sm:flex sm:flex-row sm:items-stretch" style={{ gap: "16px" }}>

        {/* LEFT — icon + title + description + badges */}
        <div className="flex items-start gap-3" style={{ width: "50%", minWidth: 0 }}>
          <Image src="/icons/weekly challenges.svg" alt="Weekly Challenge" width={28} height={28} style={{ flexShrink: 0 }} draggable={false} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: "clamp(15px, 1.8vw, 18px)", color: "#E8C96A", fontWeight: 600, marginBottom: "6px" }}>
              {challenge.title}
            </div>
            <div style={{ fontSize: "clamp(13px, 1.5vw, 16px)", color: "#FFFFFF", fontWeight: 400 }}>
              {challenge.description}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: 10 }}>
              {pointsLabel && (
                <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 999, background: "rgba(232,201,106,0.12)", border: "1px solid rgba(232,201,106,0.3)", color: "#E8C96A" }}>
                  {pointsLabel}
                </span>
              )}
              {challenge.points !== undefined && (
                <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: isCompleted ? "rgba(74,222,128,0.12)" : "rgba(232,201,106,0.08)", border: `1px solid ${isCompleted ? "rgba(74,222,128,0.3)" : "rgba(232,201,106,0.2)"}`, color: isCompleted ? "#4ADE80" : "#E8C96A" }}>
                  +{challenge.points} pts
                </span>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — progress + status + nav */}
        <div className="flex flex-col justify-center items-end" style={{ width: "50%", gap: "6px", paddingLeft: 40, paddingRight: "clamp(0px, 3vw, 40px)" }}>
          <div style={{ fontSize: "clamp(12px, 1.3vw, 14px)", color: "#FFFFFF", fontWeight: 400, display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <span>{typeof challenge.progress === "number" ? `${challenge.progress}%` : challenge.progress}</span>
            {navControls}
          </div>
          <div style={{ width: "100%", backgroundColor: "#01040B", borderRadius: "999px", height: "6px", overflow: "hidden" }}>
            <div style={{ backgroundColor: isCompleted ? "#4ADE80" : "#E8C96A", height: "6px", borderRadius: "999px", width: `${progressPercent}%`, transition: "width 0.5s ease-in-out" }} />
          </div>
          <div style={{ fontSize: "clamp(12px, 1.3vw, 14px)", color: isCompleted ? "#4ADE80" : "#E8C96A", fontWeight: 400 }}>
            {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
          </div>
        </div>
      </div>

      {/* ── Dot indicators ── */}
      {totalChallenges > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 12 }}>
          {Array.from({ length: totalChallenges }).map((_, i) => (
            <button
              key={i}
              onClick={() => onGoTo?.(i)}
              aria-label={`Challenge ${i + 1}`}
              style={{
                width: i === currentIndex ? 16 : 6, height: 6, borderRadius: 999,
                background: i === currentIndex ? "#E8C96A" : "rgba(255,255,255,0.2)",
                border: "none", padding: 0, cursor: "pointer",
                transition: "width 0.25s ease, background 0.25s ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
