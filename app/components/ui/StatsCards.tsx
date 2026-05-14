"use client";

import { useRouter } from "next/navigation";

interface StatItem {
  value: string;
  label: string;
  change?: string;
  clickable?: boolean;
}

interface StatsCardsProps {
  stats: StatItem[];
  cols?: number;
  maxWidth?: string;
  marginBottom?: string;
}

export default function StatsCards({
  stats,
  cols = 3,
  maxWidth = "75%",
  marginBottom = "24px",
}: StatsCardsProps) {
  const router = useRouter();
  const gridClass =
    cols === 4
      ? "grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4"
      : "grid grid-cols-3 gap-2 md:gap-4";

  const handleCardClick = (stat: StatItem) => {
    if (stat.clickable) {
      router.push('/points-history');
    }
  };

  return (
    <div
      className={gridClass}
      style={{ marginTop: "30px", marginBottom, maxWidth: maxWidth }}>

      {stats.map((stat) => (
        <div
          key={stat.label}
          onClick={() => handleCardClick(stat)}
          style={{
            backgroundColor: "#13192A",
            borderRadius: "5px",
            minHeight: "90px",
            padding: "clamp(8px, 1.8vw, 12px) clamp(8px, 1.6vw, 10px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
            minWidth: 0,
            cursor: stat.clickable ? "pointer" : "default",
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
          onMouseEnter={(e) => {
            if (stat.clickable) {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(232,201,106,0.2)";
            }
          }}
          onMouseLeave={(e) => {
            if (stat.clickable) {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }
          }}
        >
          <div
            style={{
              fontSize: "clamp(14px, 3.5vw, 25px)",
              color: "#E8C96A",
              fontWeight: 600,
              fontFamily: "var(--font-poppins), sans-serif",
              lineHeight: 1.15,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
            }}
          >
            {stat.value}
          </div>
          <div
            style={{
              fontSize: "clamp(10px, 2vw, 15px)",
              color: "#FFFFFF",
              fontWeight: 400,
              fontFamily: "var(--font-poppins), sans-serif",
              marginTop: "3px",
              lineHeight: 1.2,
              maxWidth: "100%",
            }}
          >
            {stat.label}
          </div>
          {stat.change && (
            <div
              style={{
                fontSize: "clamp(11px, 1.8vw, 14px)",
                color: "#4ADE80",
                fontWeight: 400,
                fontFamily: "var(--font-poppins), sans-serif",
                marginTop: "2px",
              }}
            >
              {stat.change}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
