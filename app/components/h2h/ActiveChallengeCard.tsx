import Image from "next/image";
import type { ActiveChallenge } from "@/app/types/h2h";

interface ActiveChallengeCardProps {
  challenge: ActiveChallenge;
}

const dividerStyle = {
  height: "1.5px",
  backgroundColor: "rgba(255,255,255,0.15)",
  marginLeft: "-16px",
  marginRight: "-16px",
};

const avatarStyle = {
  width: "38px", height: "38px", borderRadius: "5px",
  backgroundColor: "#060D1F", display: "flex", alignItems: "center" as const,
  justifyContent: "center", fontSize: "10px", fontWeight: 700,
  color: "#E8C96A", flexShrink: 0 as const,
};

export default function ActiveChallengeCard({ challenge }: ActiveChallengeCardProps) {
  return (
    <div
      style={{
        backgroundColor: "#13192A",
        borderRadius: "5px",
        padding: "20px 16px",
        fontFamily: "var(--font-poppins), sans-serif",
        marginBottom: "24px",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3" style={{ paddingTop: "8px", paddingBottom: "20px" }}>
        <Image
          src="/icons/challenges.svg"
          alt="Challenge"
          width={24}
          height={24}
          style={{ flexShrink: 0, filter: "brightness(0) saturate(100%) invert(82%) sepia(30%) saturate(800%) hue-rotate(5deg) brightness(100%)" }}
        />
        <div style={{ fontSize: "clamp(14px, 2vw, 18px)", color: "#E8C96A", fontWeight: 600 }}>
          {challenge.title}
        </div>
      </div>

      {/* VS Matchup
          Mobile (<md):  stacked vertically — You | Score | VS | Opponent | Score
          md+:           5-col grid
      */}
      <div className="hidden md:grid md:grid-cols-5 items-center justify-items-center" style={{ padding: "20px 0" }}>
        {/* Col 1: You */}
        <div className="flex items-center" style={{ gap: "10px", minWidth: 0 }}>
          <div style={avatarStyle}>{challenge.you.initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#E8C96A", fontWeight: 500, fontSize: "clamp(13px, 1.3vw, 16px)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {challenge.you.name}
            </div>
            <div style={{ color: "#FFFFFF", fontSize: "clamp(11px, 1.1vw, 14px)", fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {challenge.you.club}
            </div>
          </div>
        </div>

        {/* Col 2: You score */}
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#EF4444", fontWeight: 600, fontSize: "clamp(22px, 2.5vw, 30px)", lineHeight: 1 }}>
            {challenge.you.combineScore}
          </div>
          <div style={{ color: "#FFFFFF", fontSize: "clamp(11px, 1.1vw, 14px)", fontWeight: 400, marginTop: "2px" }}>
            Combine Score
          </div>
        </div>

        {/* Col 3: VS */}
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "clamp(20px, 2.2vw, 28px)", color: "#FFFFFF", fontWeight: 600 }}>VS</div>
        </div>

        {/* Col 4: Opponent */}
        <div className="flex items-center" style={{ gap: "10px", minWidth: 0 }}>
          <div style={avatarStyle}>{challenge.opponent.initials}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "#E8C96A", fontWeight: 500, fontSize: "clamp(13px, 1.3vw, 16px)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {challenge.opponent.name}
            </div>
            <div style={{ color: "#FFFFFF", fontSize: "clamp(11px, 1.1vw, 14px)", fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {challenge.opponent.club}
            </div>
          </div>
        </div>

        {/* Col 5: Opponent score */}
        <div style={{ textAlign: "center" }}>
          <div style={{ color: "#EF4444", fontWeight: 600, fontSize: "clamp(22px, 2.5vw, 30px)", lineHeight: 1 }}>
            {challenge.opponent.combineScore}
          </div>
          <div style={{ color: "#FFFFFF", fontSize: "clamp(11px, 1.1vw, 14px)", fontWeight: 400, marginTop: "2px" }}>
            Combine Score
          </div>
        </div>
      </div>

      {/* Mobile layout */}
      <div className="flex md:hidden flex-col items-center gap-4" style={{ padding: "16px 0" }}>
        {/* You row */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center" style={{ gap: "10px" }}>
            <div style={avatarStyle}>{challenge.you.initials}</div>
            <div>
              <div style={{ color: "#E8C96A", fontWeight: 500, fontSize: "15px" }}>{challenge.you.name}</div>
              <div style={{ color: "#FFFFFF", fontSize: "13px", fontWeight: 400 }}>{challenge.you.club}</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#EF4444", fontWeight: 600, fontSize: "24px", lineHeight: 1 }}>{challenge.you.combineScore}</div>
            <div style={{ color: "#FFFFFF", fontSize: "12px", fontWeight: 400, marginTop: "2px" }}>Combine Score</div>
          </div>
        </div>

        {/* VS */}
        <div style={{ fontSize: "22px", color: "#FFFFFF", fontWeight: 600 }}>VS</div>

        {/* Opponent row */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center" style={{ gap: "10px" }}>
            <div style={avatarStyle}>{challenge.opponent.initials}</div>
            <div>
              <div style={{ color: "#E8C96A", fontWeight: 500, fontSize: "15px" }}>{challenge.opponent.name}</div>
              <div style={{ color: "#FFFFFF", fontSize: "13px", fontWeight: 400 }}>{challenge.opponent.club}</div>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#EF4444", fontWeight: 600, fontSize: "24px", lineHeight: 1 }}>{challenge.opponent.combineScore}</div>
            <div style={{ color: "#FFFFFF", fontSize: "12px", fontWeight: 400, marginTop: "2px" }}>Combine Score</div>
          </div>
        </div>
      </div>

      <div style={dividerStyle} />

      {/* Status bar */}
      <div className="flex items-start gap-3" style={{ paddingTop: "16px", paddingBottom: "8px" }}>
        <Image
          src="/icons/leaderboard.svg"
          alt="Leaderboard"
          width={20}
          height={20}
          style={{ flexShrink: 0, marginTop: "2px", filter: "brightness(0) saturate(100%) invert(82%) sepia(30%) saturate(800%) hue-rotate(5deg) brightness(100%)" }}
        />
        <div>
          <div style={{ color: "#FFFFFF", fontSize: "clamp(13px, 1.4vw, 16px)", fontWeight: 400 }}>
            {challenge.statusMessage}
          </div>
          <div style={{ fontSize: "clamp(12px, 1.2vw, 14px)", fontWeight: 400, marginTop: "4px" }}>
            <span style={{ color: "#FFFFFF" }}>Wager: {challenge.wager} points · </span>
            <span style={{ color: "#E8C96A" }}>Winner takes all</span>
            <span style={{ color: "#FFFFFF" }}> · </span>
            <span style={{ color: "#E8C96A" }}>Ends {challenge.endDay}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
