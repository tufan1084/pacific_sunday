interface Tournament {
  id: number;
  name: string;
}

interface TournamentSelectorProps {
  tournaments: Tournament[];
  selectedTournamentId: number | null;
  onSelect: (tournamentId: number) => void;
}

export default function TournamentSelector({ tournaments, selectedTournamentId, onSelect }: TournamentSelectorProps) {
  console.log('TournamentSelector received tournaments:', tournaments);
  console.log('TournamentSelector selected ID:', selectedTournamentId);
  
  if (tournaments.length === 0) return null;

  if (tournaments.length === 1) {
    return (
      <div
        style={{
          backgroundColor: "#13192A",
          borderRadius: "5px",
          padding: "12px 16px",
          fontFamily: "var(--font-poppins), sans-serif",
        }}
      >
        <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>
          Tournament
        </div>
        <div style={{ fontSize: "15px", color: "#E8C96A", fontWeight: 500 }}>
          {tournaments[0].name}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: "#13192A",
        borderRadius: "5px",
        padding: "12px 16px",
        fontFamily: "var(--font-poppins), sans-serif",
      }}
    >
      <label
        htmlFor="tournament-select"
        style={{
          fontSize: "13px",
          color: "rgba(255,255,255,0.5)",
          marginBottom: "8px",
          display: "block",
        }}
      >
        Select Tournament
      </label>
      <select
        id="tournament-select"
        value={selectedTournamentId || ""}
        onChange={(e) => onSelect(Number(e.target.value))}
        style={{
          width: "100%",
          backgroundColor: "#060D1F",
          color: "#E8C96A",
          border: "1px solid rgba(232,201,106,0.3)",
          borderRadius: "5px",
          padding: "10px 12px",
          fontSize: "14px",
          fontWeight: 500,
          fontFamily: "var(--font-poppins), sans-serif",
          cursor: "pointer",
          outline: "none",
        }}
      >
        {tournaments.map((tournament) => (
          <option key={tournament.id} value={tournament.id}>
            {tournament.name}
          </option>
        ))}
      </select>
    </div>
  );
}
