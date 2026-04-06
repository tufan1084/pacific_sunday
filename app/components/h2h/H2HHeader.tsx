import Button from "@/app/components/ui/Button";

interface H2HHeaderProps {
  onNewChallenge?: () => void;
}

export default function H2HHeader({ onNewChallenge }: H2HHeaderProps) {
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
          Head-to-Head Challenges
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
          Challenge any owner to a weekly fantasy duel — wager points, winner takes all
        </div>
      </div>

      <Button onClick={onNewChallenge}>+ New Challenge</Button>
    </div>
  );
}
