import type { StatCard } from "@/app/types";

interface StatsGridProps {
  stats: StatCard[];
}

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
      style={{ marginTop: "30px", marginBottom: "10px" }}
    >
      {stats.map((stat) => (
        <div
          key={stat.label}
          style={{
            backgroundColor: "#13192A",
            borderRadius: "5px",
            height: "clamp(70px, 8vw, 100px)",
            padding: "clamp(12px, 1.5vw, 20px) clamp(8px, 1vw, 12px)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div style={{ fontSize: "clamp(16px, 2vw, 25px)", color: "#E8C96A", fontWeight: 600, fontFamily: "var(--font-poppins), sans-serif" }}>{stat.value}</div>
          <div style={{ fontSize: "clamp(11px, 1.2vw, 15px)", color: "#FFFFFF", fontWeight: 400, fontFamily: "var(--font-poppins), sans-serif", marginTop: "2px" }}>{stat.label}</div>
          <div style={{ fontSize: "clamp(10px, 1.1vw, 14px)", color: "#4ADE80", fontWeight: 400, fontFamily: "var(--font-poppins), sans-serif", marginTop: "2px" }}>{stat.change}</div>
        </div>
      ))}
    </div>
  );
}
