import Button from "@/app/components/ui/Button";

interface FantasyHeaderProps {
  picksCount: number;
  totalPicks: number;
}

export default function FantasyHeader({ picksCount, totalPicks }: FantasyHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8">
      <div>
        <div
          className="tracking-wide"
          style={{
            fontSize: "clamp(18px, 2.5vw, 25px)",
            color: "#E8C96A",
            fontWeight: 400,
            fontFamily: "var(--font-poppins), sans-serif",
          }}
        >
          Fantasy Golf — The Masters 2026
        </div>
        <div
          className="mt-1"
          style={{
            fontSize: "clamp(13px, 1.5vw, 16px)",
            color: "#FFFFFF",
            fontWeight: 400,
            fontFamily: "var(--font-poppins), sans-serif",
          }}
        >
          The Masters 2026 · Augusta National · Apr 10–13
        </div>
      </div>

      <div className="flex items-center gap-4" style={{ flexShrink: 0 }}>
        <span
          style={{
            color: "#E8C96A",
            fontSize: "clamp(14px, 1.5vw, 18px)",
            fontWeight: 500,
            fontFamily: "var(--font-poppins), sans-serif",
          }}
        >
          {picksCount}/{totalPicks} Picks
        </span>
        <Button href="/fantasy-golf/picks">Lock Picks</Button>
      </div>
    </div>
  );
}
