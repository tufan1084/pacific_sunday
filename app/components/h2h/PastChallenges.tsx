import Image from "next/image";
import type { PastChallenge } from "@/app/types/h2h";

interface PastChallengesProps {
  challenges: PastChallenge[];
}

const headerDividerStyle = {
  height: "1.5px",
  backgroundColor: "rgba(255,255,255,0.15)",
  margin: "0 calc(-1 * clamp(16px, 2vw, 20px))",
};

const rowDividerStyle = {
  height: "1.5px",
  backgroundColor: "rgba(255,255,255,0.15)",
  margin: "0 calc(-1 * clamp(16px, 2vw, 20px))",
};

export default function PastChallenges({ challenges }: PastChallengesProps) {
  return (
    <div
      style={{
        backgroundColor: "#13192A",
        borderRadius: "5px",
        padding: "clamp(16px, 2vw, 20px)",
        fontFamily: "var(--font-poppins), sans-serif",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3" style={{ paddingBottom: "20px", paddingTop: "8px" }}>
        <Image src="/icons/past-challenges.svg" alt="Past Challenges" width={24} height={24} style={{ flexShrink: 0 }} />
        <div style={{ fontSize: "18px", color: "#E8C96A", fontWeight: 600 }}>
          Past Challenges
        </div>
      </div>
      <div style={headerDividerStyle} />

      {/* Rows — scrollable */}
      <div className="past-scroll" style={{ overflowY: "auto", maxHeight: "340px", margin: "0 calc(-1 * clamp(16px, 2vw, 20px))", padding: "0 clamp(16px, 2vw, 20px)", scrollbarWidth: "thin", scrollbarColor: "#999486 #313131" }}>
        {challenges.map((ch, i) => (
          <div key={i}>
            {/* Desktop: 4 cols | Mobile: 2 cols */}
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-10"
              style={{ alignItems: "center", paddingTop: "10px", paddingBottom: "10px" }}
            >
              {/* Col 1: Player info */}
              <div className="flex items-center" style={{ gap: "10px" }}>
                <div
                  style={{
                    width: "38px", height: "38px", borderRadius: "5px",
                    backgroundColor: "#060D1F", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "10px", fontWeight: 700,
                    color: "#E8C96A", flexShrink: 0,
                  }}
                >
                  {ch.initials}
                </div>
                <div>
                  <div style={{ color: "#E8C96A", fontWeight: 500, fontSize: "clamp(13px, 1.2vw, 16px)" }}>
                    {ch.name}
                  </div>
                  <div style={{ color: "#FFFFFF", fontSize: "clamp(11px, 1vw, 14px)", fontWeight: 400 }}>
                    {ch.club}
                  </div>
                </div>
              </div>

              {/* Col 2: Place */}
              <div>
                <div style={{ color: "#E8C96A", fontWeight: 500, fontSize: "clamp(13px, 1.2vw, 16px)" }}>
                  {ch.place}
                </div>
                <div style={{ color: "#FFFFFF", fontSize: "clamp(11px, 1vw, 14px)", fontWeight: 400 }}>
                  {ch.placeDetail}
                </div>
              </div>

              {/* Col 3: Weather */}
              <div style={{ paddingLeft: "48px" }}>
                <div style={{ color: "#E8C96A", fontWeight: 500, fontSize: "clamp(13px, 1.2vw, 16px)" }}>
                  {ch.weather}
                </div>
                <div style={{ color: "#FFFFFF", fontSize: "clamp(11px, 1vw, 14px)", fontWeight: 400 }}>
                  {ch.weatherDetail}
                </div>
              </div>

              {/* Col 4: Result */}
              <div className="md:text-right">
                <div style={{ color: ch.result === "Won" ? "#E8C96A" : "#EF4444", fontWeight: 500, fontSize: "clamp(13px, 1.2vw, 16px)" }}>
                  {ch.result}
                </div>
                <div style={{ color: "#FFFFFF", fontSize: "clamp(11px, 1vw, 14px)", fontWeight: 400 }}>
                  {ch.points}
                </div>
              </div>
            </div>

            {i < challenges.length - 1 && <div style={rowDividerStyle} />}
          </div>
        ))}
      </div>
    </div>
  );
}
