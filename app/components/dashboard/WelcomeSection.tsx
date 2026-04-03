import Button from "@/app/components/ui/Button";

interface WelcomeSectionProps {
  userName: string;
  countdown: string;
  picksRemaining: number;
  currentRank: number;
}

export default function WelcomeSection({
  userName,
  countdown,
  picksRemaining,
  currentRank,
}: WelcomeSectionProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div>
        <div
          className="tracking-wide"
          style={{ fontSize: "clamp(16px, 2vw, 25px)", color: "#E8C96A", fontWeight: 400, fontFamily: "var(--font-poppins), sans-serif" }}
        >
          Good Morning, {userName}
        </div>
        <div
          className="mt-1"
          style={{ fontSize: "clamp(12px, 1.2vw, 16px)", color: "#FFFFFF", fontFamily: "var(--font-poppins), sans-serif", fontWeight: 400 }}
        >
          Masters picks close in <span style={{ color: "#E8C96A" }}>{countdown}</span> — {picksRemaining} picks remaining. Currently ranked{" "}
          <span className="text-ps-gold">#{currentRank}</span>.
        </div>
      </div>
      <Button href="/fantasy-golf/picks">Make Picks</Button>
    </div>
  );
}
