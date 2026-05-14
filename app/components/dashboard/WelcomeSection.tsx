import Button from "@/app/components/ui/Button";

interface Tournament {
  name: string;
  countdown: string;
  picksRemaining: number;
}

interface WelcomeSectionProps {
  userName: string;
  greeting?: string;
  currentRank: number;
  tournaments: Tournament[];
}

export default function WelcomeSection({ userName, greeting = "Morning", currentRank, tournaments }: WelcomeSectionProps) {
  const allPicksLocked = tournaments.length > 0 && tournaments.every(t => t.picksRemaining === 0);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
      <div className="flex-1">
        <div
          className="tracking-wide"
          style={{ fontSize: "clamp(18px, 2.5vw, 25px)", color: "#E8C96A", fontWeight: 400, fontFamily: "var(--font-poppins), sans-serif" }}
        >
          Good {greeting}, {userName}
        </div>
        <div
          className="mt-1 space-y-1"
          style={{ fontSize: "clamp(13px, 1.5vw, 16px)", color: "#FFFFFF", fontFamily: "var(--font-poppins), sans-serif", fontWeight: 400 }}
        >
          {tournaments.length > 0 ? (
            tournaments.map((tournament, index) => {
              const picksText = tournament.picksRemaining === 1 ? "pick" : "picks";
              const isLive = tournament.countdown.toLowerCase() === "now" || tournament.countdown.toLowerCase() === "live";
              const hasPicksRemaining = tournament.picksRemaining > 0;
              
              return (
                <div key={index}>
                  <span className="font-medium">{tournament.name}</span>{" "}
                  {isLive ? (
                    <>
                      is <span style={{ color: "#4ADE80", fontWeight: 500 }}>Live</span>
                      {hasPicksRemaining ? (
                        <> — {tournament.picksRemaining} {picksText} not selected.</>
                      ) : (
                        <> — All picks locked.</>
                      )}
                    </>
                  ) : (
                    <>
                      picks close in <span style={{ color: "#E8C96A" }}>{tournament.countdown}</span>
                      {hasPicksRemaining ? (
                        <> — {tournament.picksRemaining} {picksText} remaining.</>
                      ) : (
                        <> — Team locked.</>
                      )}
                    </>
                  )}
                </div>
              );
            })
          ) : (
            <div>No upcoming tournaments at the moment.</div>
          )}
          <div className="mt-1">
            Currently ranked <span className="text-ps-gold">#{currentRank}</span>.
          </div>
        </div>
      </div>
      <Button href="/fantasy-golf">{allPicksLocked ? "View Picks" : "Make Picks"}</Button>
    </div>
  );
}
