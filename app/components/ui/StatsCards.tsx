interface StatItem {
  value: string;
  label: string;
  change?: string;
}

interface StatsCardsProps {
  stats: StatItem[];
  cols?: number;
  maxWidth?: string;
  marginBottom?: string;
}

export default function StatsCards({
  stats,
  cols = 3,
  maxWidth = "75%",
  marginBottom = "24px",
}: StatsCardsProps) {
  const gridClass =
    cols === 4
      ? "grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4"
      : "grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4";

  return (
    <div
      className={gridClass}
      style={{ marginTop: "30px", marginBottom, maxWidth: maxWidth }}>

      {stats.map((stat) => (
        <div
          key={stat.label}
          style={{
            backgroundColor: "#13192A",
            borderRadius: "5px",
            minHeight: "70px",
            padding: "12px 10px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              fontSize: "clamp(15px, 3.5vw, 25px)",
              color: "#E8C96A",
              fontWeight: 600,
              fontFamily: "var(--font-poppins), sans-serif",
            }}
          >
            {stat.value}
          </div>
          <div
            style={{
              fontSize: "clamp(12px, 2vw, 15px)",
              color: "#FFFFFF",
              fontWeight: 400,
              fontFamily: "var(--font-poppins), sans-serif",
              marginTop: "2px",
            }}
          >
            {stat.label}
          </div>
          {stat.change && (
            <div
              style={{
                fontSize: "clamp(11px, 1.8vw, 14px)",
                color: "#4ADE80",
                fontWeight: 400,
                fontFamily: "var(--font-poppins), sans-serif",
                marginTop: "2px",
              }}
            >
              {stat.change}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
