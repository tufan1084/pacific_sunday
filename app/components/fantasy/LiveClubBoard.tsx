import type { ClubBoardEntry } from "@/app/types/fantasy";

interface LiveClubBoardProps {
  entries: ClubBoardEntry[];
}

const dividerStyle = {
  height: "1.5px",
  backgroundColor: "rgba(255,255,255,0.15)",
  margin: "0 calc(-1 * clamp(16px, 2vw, 20px))",
};

export default function LiveClubBoard({ entries }: LiveClubBoardProps) {
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
      <div
        className="flex items-center justify-between"
        style={{ paddingBottom: "20px", paddingTop: "8px" }}
      >
        <div style={{ fontSize: "clamp(14px, 1.4vw, 18px)", color: "#E8C96A", fontWeight: 600 }}>
          Live Club Board
        </div>
        <div
          style={{
            fontSize: "clamp(11px, 1vw, 14px)",
            color: "#FFFFFF",
            fontWeight: 400,
            textAlign: "right",
          }}
        >
          Top 10 earn <span style={{ color: "#4ADE80", fontWeight: 500 }}>+1,000 pts</span>{" "}
          (2× Major)
        </div>
      </div>
      <div style={dividerStyle} />

      {/* Entries */}
      {entries.map((entry, i) => (
        <div key={entry.rank}>
          <div
            className="flex items-center justify-between"
            style={{ height: "clamp(56px, 5vw, 68px)" }}
          >
            <div className="flex items-center" style={{ gap: "10px", minWidth: 0 }}>
              <span
                style={{
                  color: "#E8C96A",
                  width: "16px",
                  textAlign: "right",
                  flexShrink: 0,
                  fontSize: "clamp(11px, 1.1vw, 16px)",
                }}
              >
                {entry.rank}.
              </span>

              <div
                style={{
                  width: "38px",
                  height: "38px",
                  borderRadius: "5px",
                  backgroundColor: "#060D1F",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: 700,
                  color: "#E8C96A",
                  flexShrink: 0,
                }}
              >
                {entry.initials}
              </div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    color: "#E8C96A",
                    fontWeight: 500,
                    fontSize: "clamp(12px, 1.1vw, 16px)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {entry.name}
                </div>
                <div
                  style={{
                    color: "#FFFFFF",
                    fontSize: "clamp(11px, 1vw, 15px)",
                    fontWeight: 400,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {entry.club}
                </div>
              </div>
            </div>

            {/* Score */}
            <span
              style={{
                color: "#E8C96A",
                fontWeight: 500,
                fontSize: "clamp(12px, 1.1vw, 16px)",
                flexShrink: 0,
                marginLeft: "8px",
              }}
            >
              {entry.score.toLocaleString()}
            </span>
          </div>

          {i < entries.length - 1 && <div style={dividerStyle} />}
        </div>
      ))}
    </div>
  );
}
