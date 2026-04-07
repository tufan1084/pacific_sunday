import Image from "next/image";
import { GOLF_STATS } from "@/app/lib/profile-data";

const goldenFilter = "brightness(0) saturate(100%) invert(83%) sepia(43%) saturate(500%) hue-rotate(358deg) brightness(98%)";

function StatIcon({ type }: { type: string }) {
  if (type === "index") return <Image src="/icons/index.svg" alt="index" width={36} height={36} style={{ flexShrink: 0 }} />;
  if (type === "home") return <Image src="/icons/home.svg" alt="home" width={36} height={36} style={{ flexShrink: 0 }} />;
  if (type === "score") return <Image src="/icons/leaderboard.svg" alt="score" width={36} height={36} style={{ flexShrink: 0, filter: goldenFilter }} />;
  return null;
}

export default function YourGolfStats() {
  return (
    <div style={{ backgroundColor: "#13192A", borderRadius: "5px", padding: "20px", fontFamily: "var(--font-poppins), sans-serif" }}>
      <div style={{ color: "#E8C96A", fontSize: "clamp(16px, 1.8vw, 20px)", fontWeight: 400, marginBottom: "14px" }}>Your Golf Stats</div>
      <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.08)", marginLeft: "-20px", marginRight: "-20px" }} />

      {GOLF_STATS.map((stat, i) => (
        <div key={i} className="flex items-center gap-3" style={{ paddingTop: "12px", paddingBottom: "12px" }}>
          <StatIcon type={stat.icon} />
          <div>
            <div style={{ color: "#E8C96A", fontSize: "clamp(14px, 1.5vw, 18px)", fontWeight: 400 }}>{stat.value}</div>
            <div style={{ color: "#FFFFFF", fontSize: "clamp(12px, 1.2vw, 15px)", fontWeight: 400, marginTop: "2px" }}>{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
