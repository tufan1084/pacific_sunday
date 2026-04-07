import ChallengeCard from "@/app/components/challenges/ChallengeCard";
import { WEEKLY_CHALLENGES } from "@/app/lib/challenges-data";

export default function ChallengesPage() {
  return (
    <>
      {/* Header */}
      <div style={{ fontFamily: "var(--font-poppins), sans-serif", marginBottom: "32px" }}>
        <div style={{ color: "#E8C96A", fontSize: "clamp(18px, 2.5vw, 25px)", fontWeight: 400 }}>
          Weekly Challenges
        </div>
        <div style={{ color: "#FFFFFF", fontSize: "clamp(13px, 1.3vw, 16px)", fontWeight: 400, marginTop: "6px" }}>
          Complete challenges to earn bonus points and unlock achievements
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {WEEKLY_CHALLENGES.map((challenge, i) => (
          <ChallengeCard key={i} {...challenge} />
        ))}
      </div>
    </>
  );
}
