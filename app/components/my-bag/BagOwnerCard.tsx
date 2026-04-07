"use client";

import Image from "next/image";
import { BAG_OWNER, BAG_STATS } from "@/app/lib/my-bag-data";

function StatIcon({ type }: { type: string }) {
  if (type === "star") return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
  const iconMap: Record<string, string> = {
    rank: "/icons/rank.svg",
    register: "/icons/register.svg",
    weeks: "/icons/weeks.svg",
  };
  if (iconMap[type]) return (
    <Image src={iconMap[type]} alt={type} width={32} height={32} style={{ filter: "brightness(0) saturate(100%) invert(82%) sepia(30%) saturate(800%) hue-rotate(5deg) brightness(100%)", flexShrink: 0 }} />
  );
  return null;
}

export default function BagOwnerCard() {
  return (
    <div style={{ backgroundColor: "#13192A", borderRadius: "5px", marginTop: "30px", fontFamily: "var(--font-poppins), sans-serif", overflow: "hidden" }}>

      {/* Owner info — horizontal layout matching design */}
      <div className="flex flex-wrap items-center gap-4" style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <div style={{ color: "#E8C96A", fontSize: "clamp(16px, 1.8vw, 20px)", fontWeight: 500 }}>{BAG_OWNER.team}</div>
          <div style={{ color: "#FFFFFF", fontSize: "clamp(13px, 1.3vw, 16px)", fontWeight: 400 }}>{BAG_OWNER.serial}</div>
        </div>
        <div className="flex items-center gap-2" style={{ backgroundColor: "#E8C96A", borderRadius: "4px", padding: "6px 12px", display: "inline-flex", flexShrink: 0 }}>
          <Image src="/icons/verified.svg" alt="verified" width={18} height={18} style={{ filter: "brightness(0)", flexShrink: 0 }} />
          <span style={{ color: "#060D1F", fontSize: "clamp(11px, 1vw, 13px)", fontWeight: 600, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>NFC VERIFIED OWNER</span>
        </div>
      </div>

      {/* Stats — 2 cols on mobile, 4 cols on sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-4">
        {BAG_STATS.map((stat, i) => (
          <div
            key={i}
            style={{
              padding: "20px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              borderRight: (i === 0 || i === 2) ? "1px solid rgba(255,255,255,0.12)" : "none",
              borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.12)" : "none",
            }}
          >
            <StatIcon type={stat.icon} />
            <div>
              <div style={{ color: "#E8C96A", fontSize: "clamp(16px, 2vw, 28px)", fontWeight: 400, lineHeight: 1.1 }}>{stat.value}</div>
              <div style={{ color: "#FFFFFF", fontSize: "clamp(11px, 1.1vw, 14px)", fontWeight: 400, marginTop: "4px" }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
