import Image from "next/image";
import type { Challenge } from "@/app/types";

interface WeeklyChallengeProps {
  challenge: Challenge;
}

export default function WeeklyChallenge({ challenge }: WeeklyChallengeProps) {
  return (
    <div
      className="flex flex-col sm:flex-row sm:items-stretch"
      style={{
        backgroundColor: "#13192A",
        borderRadius: "5px",
        margin: "16px 0",
        padding: "16px 12px 12px 12px",
        gap: "16px",
        width: "100%",
        fontFamily: "var(--font-poppins), sans-serif",
        position: "relative",
      }}
    >
      {/* Icon + Left text */}
      <div className="flex items-start gap-3 sm:w-1/2">
        <Image src="/icons/weekly challenges.svg" alt="Weekly Challenge" width={28} height={28} style={{ flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: "clamp(14px, 1.4vw, 18px)", color: "#E8C96A", fontWeight: 600, marginBottom: "6px" }}>
            {challenge.title}
          </div>
          <div style={{ fontSize: "clamp(12px, 1.2vw, 16px)", color: "#FFFFFF", fontWeight: 400 }}>
            {challenge.description}
          </div>
        </div>
      </div>

      {/* Right — progress */}
      <div className="flex flex-col justify-center sm:w-1/2 sm:items-end" style={{ gap: "6px", paddingRight: "40px" }}>
        <div style={{ fontSize: "clamp(11px, 1vw, 14px)", color: "#FFFFFF", fontWeight: 400, textAlign: "right" }}>
          {challenge.progress}
        </div>
        <div style={{ width: "100%", backgroundColor: "#1e293b", borderRadius: "999px", height: "6px" }}>
          <div style={{ backgroundColor: "#E8C96A", height: "6px", borderRadius: "999px", width: "66%" }} />
        </div>
        <div style={{ fontSize: "clamp(11px, 1vw, 14px)", color: "#4ADE80", fontWeight: 400, textAlign: "right" }}>
          {challenge.status.charAt(0).toUpperCase() + challenge.status.slice(1)}
        </div>
      </div>
    </div>
  );
}
