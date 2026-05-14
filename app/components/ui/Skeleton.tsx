"use client";

import React from "react";

export function Skeleton({ h, w = "100%", r = 6, mb = 0, style = {} }: {
  h: number | string; w?: number | string; r?: number; mb?: number; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      height: h, width: w, borderRadius: r, marginBottom: mb,
      background: "linear-gradient(90deg,#0f1a30 25%,#1a2540 50%,#0f1a30 75%)",
      backgroundSize: "200% 100%",
      animation: "sk-shimmer 1.4s infinite",
      flexShrink: 0,
      ...style,
    }} />
  );
}

export function SkeletonCard({ rows = 3, height = 100 }: { rows?: number; height?: number }) {
  return (
    <div style={{ background: "#0f1a30", borderRadius: 8, padding: 20, marginBottom: 12 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} h={14} w={i === 0 ? "60%" : i === rows - 1 ? "40%" : "85%"} mb={i < rows - 1 ? 10 : 0} />
      ))}
    </div>
  );
}

export function SkeletonList({ count = 4, rowHeight = 60 }: { count?: number; rowHeight?: number }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background: "#0f1a30", borderRadius: 8, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, height: rowHeight }}>
          <Skeleton h={36} w={36} r={5} />
          <div style={{ flex: 1 }}>
            <Skeleton h={13} w="55%" mb={8} />
            <Skeleton h={11} w="35%" />
          </div>
          <Skeleton h={13} w={50} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid({ cols = 3, count = 6 }: { cols?: number; count?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ background: "#0f1a30", borderRadius: 8, padding: 20 }}>
          <Skeleton h={40} w={40} r={20} mb={12} />
          <Skeleton h={14} w="70%" mb={8} />
          <Skeleton h={11} w="90%" mb={6} />
          <Skeleton h={8} w="100%" r={4} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats({ cols = 4 }: { cols?: number }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, marginBottom: 16 }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} style={{ background: "#0f1a30", borderRadius: 8, padding: 16 }}>
          <Skeleton h={28} w="60%" mb={8} />
          <Skeleton h={13} w="80%" />
        </div>
      ))}
    </div>
  );
}

export const shimmerCss = `@keyframes sk-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`;
