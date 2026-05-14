"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";

function StatIcon({ type }: { type: string }) {
  if (type === "star") return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
  const iconMap: Record<string, string> = {
    rank: "/icons/rank.svg",
    register: "/icons/register.svg",
    weeks: "/icons/weeks.svg",
  };
  if (iconMap[type]) return (
    <Image src={iconMap[type]} alt={type} width={28} height={28} style={{ filter: "brightness(0) saturate(100%) invert(82%) sepia(30%) saturate(800%) hue-rotate(5deg) brightness(100%)", flexShrink: 0 }} />
  );
  return null;
}

interface BagOwnerCardProps {
  bagsData?: any;
}

export default function BagOwnerCard({ bagsData }: BagOwnerCardProps) {
  const router = useRouter();
  const firstBag = bagsData?.bags?.[0];
  const bagName = firstBag?.bagType?.name || "—";
  const uid = firstBag?.uid || "—";
  const userPoints = bagsData?.userPoints || 0;
  const userRank = bagsData?.userRank || null;
  const weeksRegistered = bagsData?.weeksRegistered || 0;

  const registeredDate = firstBag?.registeredAt
    ? new Date(firstBag.registeredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : "—";

  const stats = [
    { icon: "star", value: userPoints.toLocaleString(), label: "Points", clickable: true },
    { icon: "rank", value: userRank ? `#${userRank}` : "—", label: "Rank", clickable: false },
    { icon: "register", value: registeredDate, label: "Registered", clickable: false },
    { icon: "weeks", value: weeksRegistered.toString(), label: "Weeks", clickable: false },
  ];

  return (
    <div style={{ marginTop: "30px", fontFamily: "var(--font-poppins), sans-serif", backgroundColor: "#13192A", borderRadius: "5px", overflow: "hidden" }}>
      
      {/* Desktop Layout - Original Design */}
      <div className="hidden lg:grid lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
        {/* Card 1: Bag Info */}
        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "12px", borderRight: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
            <div style={{ color: "#E8C96A", fontSize: "clamp(18px, 2vw, 20px)", fontWeight: 500 }}>{bagName}</div>
            <div style={{ color: "#FFFFFF", fontSize: "clamp(14px, 1.4vw, 16px)", fontWeight: 400, wordBreak: "break-all" }}>{uid}</div>
          </div>
          <div className="flex items-center gap-2" style={{ backgroundColor: "#E8C96A", borderRadius: "4px", padding: "4px 8px", display: "inline-flex", width: "fit-content" }}>
            <Image src="/icons/verified.svg" alt="verified" width={14} height={14} style={{ filter: "brightness(0)", flexShrink: 0 }} />
            <span style={{ color: "#060D1F", fontSize: "clamp(9px, 0.9vw, 11px)", fontWeight: 600, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>NFC VERIFIED OWNER</span>
          </div>
        </div>

        {/* Stats Cards */}
        {stats.map((stat, i) => (
          <div
            key={i}
            onClick={() => stat.clickable && router.push('/points-history')}
            style={{
              padding: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              borderRight: i < 3 ? "1px solid rgba(255,255,255,0.08)" : "none",
              cursor: stat.clickable ? "pointer" : "default",
              transition: "background-color 0.2s",
            }}
            onMouseEnter={(e) => {
              if (stat.clickable) {
                e.currentTarget.style.backgroundColor = "rgba(232,201,106,0.05)";
              }
            }}
            onMouseLeave={(e) => {
              if (stat.clickable) {
                e.currentTarget.style.backgroundColor = "transparent";
              }
            }}
          >
            <StatIcon type={stat.icon} />
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <div style={{ color: "#E8C96A", fontSize: "clamp(18px, 2vw, 28px)", fontWeight: 500, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ color: "#FFFFFF", fontSize: "clamp(11px, 1.1vw, 13px)", fontWeight: 400 }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile Layout - 2x2 Grid */}
      <div className="lg:hidden">
        {/* Bag Info - Full Width */}
        <div style={{ padding: "clamp(16px, 3vw, 24px)", display: "flex", flexDirection: "column", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
            <div style={{ color: "#E8C96A", fontSize: "clamp(18px, 2vw, 20px)", fontWeight: 500 }}>{bagName}</div>
            <div style={{ color: "#FFFFFF", fontSize: "clamp(14px, 1.4vw, 16px)", fontWeight: 400, wordBreak: "break-all" }}>{uid}</div>
          </div>
          <div className="flex items-center gap-2" style={{ backgroundColor: "#E8C96A", borderRadius: "4px", padding: "4px 8px", display: "inline-flex", width: "fit-content" }}>
            <Image src="/icons/verified.svg" alt="verified" width={14} height={14} style={{ filter: "brightness(0)", flexShrink: 0 }} />
            <span style={{ color: "#060D1F", fontSize: "clamp(9px, 0.9vw, 11px)", fontWeight: 600, letterSpacing: "0.04em", whiteSpace: "nowrap" }}>NFC VERIFIED OWNER</span>
          </div>
        </div>

        {/* Stats - 2x2 Grid */}
        <div className="grid grid-cols-2">
          {stats.map((stat, i) => (
            <div
              key={i}
              onClick={() => stat.clickable && router.push('/points-history')}
              style={{
                padding: "clamp(14px, 2vw, 16px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                borderRight: (i % 2 === 0) ? "1px solid rgba(255,255,255,0.08)" : "none",
                borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.08)" : "none",
                cursor: stat.clickable ? "pointer" : "default",
                transition: "background-color 0.2s",
              }}
              onMouseEnter={(e) => {
                if (stat.clickable) {
                  e.currentTarget.style.backgroundColor = "rgba(232,201,106,0.05)";
                }
              }}
              onMouseLeave={(e) => {
                if (stat.clickable) {
                  e.currentTarget.style.backgroundColor = "transparent";
                }
              }}
            >
              <StatIcon type={stat.icon} />
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ color: "#E8C96A", fontSize: "clamp(18px, 2vw, 28px)", fontWeight: 500, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ color: "#FFFFFF", fontSize: "clamp(11px, 1.1vw, 13px)", fontWeight: 400 }}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
