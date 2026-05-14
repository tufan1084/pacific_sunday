import Image from "next/image";
import type { ProjectedPick } from "@/app/types/fantasy";

interface ProjectedScoreProps {
  picks: ProjectedPick[];
  totalPoints: number;
}

export default function ProjectedScore({ picks, totalPoints }: ProjectedScoreProps) {
  const maxScore = Math.max(...picks.map((p) => p.maxPoints));

  return (
    <div
      style={{
        backgroundColor: "#13192A",
        borderRadius: "5px",
        padding: "clamp(14px, 2vw, 16px)",
        marginBottom: "24px",
        fontFamily: "var(--font-poppins), sans-serif",
      }}
    >
      {/* Header row */}
      <div className="flex justify-between items-start" style={{ marginBottom: "6px" }}>
        <div className="flex items-start gap-3">
          <Image
            src="/icons/weekly challenges.svg"
            alt="Projected"
            width={28}
            height={28}
            style={{ flexShrink: 0 }}
          />
          <div>
            <div style={{ fontSize: "clamp(14px, 2vw, 18px)", color: "#E8C96A", fontWeight: 600 }}>
              Projected Score — {picks.length} picks
            </div>
            <div style={{ fontSize: "clamp(11px, 1.5vw, 14px)", color: "#FFFFFF", fontWeight: 400, marginTop: "2px" }}>
              Major multiplier applied automatically
            </div>
          </div>
        </div>

        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <div style={{ fontSize: "clamp(14px, 2vw, 18px)", color: "#E8C96A", fontWeight: 600 }}>
            +{totalPoints} pts
          </div>
          <div style={{ fontSize: "clamp(11px, 1.5vw, 14px)", color: "#FFFFFF", fontWeight: 400, marginTop: "2px" }}>
            2× Major bonus included
          </div>
        </div>
      </div>

      {/* Progress bars */}
      <div style={{ marginTop: "20px" }}>
        {picks.map((pick) => {
          const pct = Math.round((pick.points / maxScore) * 100);
          return (
            <div
              key={pick.tier + pick.golfer}
              className="flex items-center"
              style={{ marginBottom: "14px", gap: "10px" }}
            >
              {/* Label */}
              <div
                style={{
                  width: "clamp(110px, 18vw, 160px)",
                  fontSize: "clamp(12px, 1.5vw, 16px)",
                  color: "#E8C96A",
                  fontWeight: 400,
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {pick.tier} {pick.golfer} ({pick.score})
              </div>

              {/* Bar */}
              <div
                style={{
                  flex: 1,
                  height: "5px",
                  backgroundColor: "#01040B",
                  borderRadius: "999px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    backgroundColor: "#E8C96A",
                    borderRadius: "999px",
                    transition: "width 0.5s ease",
                  }}
                />
              </div>

              {/* Score */}
              <div
                style={{
                  width: "clamp(28px, 4vw, 50px)",
                  textAlign: "right",
                  fontSize: "clamp(12px, 1.5vw, 16px)",
                  color: pick.score.startsWith("-") ? "#E8C96A" : "#61687D",
                  fontWeight: 500,
                  flexShrink: 0,
                }}
              >
                {pick.points}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
