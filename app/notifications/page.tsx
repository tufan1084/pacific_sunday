import Image from "next/image";

const NOTIFICATIONS = [
  {
    icon: "star",
    title: "Masters 2026 — Double Points Active!",
    body: "All Major tournaments earn 2× points automatically. Submit picks before Thu 8 AM ET.",
    time: "2h ago · All Owners",
    action: { label: "Pick Now", href: "/fantasy-golf" },
  },
  {
    icon: "trophy",
    title: "You finished Top 10!",
    body: "The Players: +500 pts. Total now 2,840.",
    time: "Mar 15, 2026",
    action: null,
  },
  {
    icon: "achievement",
    title: "Achievement: Duel Master",
    body: "Won first H2H. +75 bonus pts!",
    time: "Mar 15, 2026",
    action: null,
  },
];

const goldenFilter = "brightness(0) saturate(100%) invert(83%) sepia(43%) saturate(500%) hue-rotate(358deg) brightness(98%)";

function NotifIcon({ type }: { type: string }) {
  if (type === "star") return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
  if (type === "trophy") return (
    <Image src="/icons/leaderboard.svg" alt="leaderboard" width={32} height={32} style={{ flexShrink: 0, filter: goldenFilter }} />
  );
  return (
    <Image src="/icons/dashboard_leaderboard.svg" alt="achievement" width={32} height={32} style={{ flexShrink: 0 }} />
  );
}

export default function NotificationsPage() {
  return (
    <>
      <div style={{ fontFamily: "var(--font-poppins), sans-serif", marginBottom: "30px" }}>
        <span style={{ color: "#E8C96A", fontSize: "clamp(18px, 2.5vw, 25px)", fontWeight: 400 }}>Notifications</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontFamily: "var(--font-poppins), sans-serif" }}>
        {NOTIFICATIONS.map((notif, i) => (
          <div key={i} style={{ backgroundColor: "#13192A", borderRadius: "5px", padding: "20px 20px" }}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              {/* Icon + content */}
              <div className="flex items-start gap-3" style={{ flex: 1, minWidth: 0 }}>
                <NotifIcon type={notif.icon} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ color: "#E8C96A", fontSize: "clamp(15px, 1.8vw, 20px)", fontWeight: 400, marginBottom: "6px" }}>
                    {notif.title}
                  </div>
                  <div style={{ color: "#FFFFFF", fontSize: "clamp(13px, 1.4vw, 16px)", fontWeight: 400, marginBottom: "8px", lineHeight: 1.5 }}>
                    {notif.body}
                  </div>
                  <div style={{ color: "#74FF6D", fontSize: "clamp(12px, 1.1vw, 14px)", fontWeight: 400 }}>
                    {notif.time}
                  </div>
                  
                  {/* Action button - mobile only */}
                  {notif.action && (
                    <a
                      href={notif.action.href}
                      className="sm:hidden"
                      style={{
                        backgroundColor: "#E8C96A",
                        color: "#060D1F",
                        borderRadius: "5px",
                        padding: "10px 28px",
                        fontSize: "clamp(13px, 1.3vw, 16px)",
                        fontWeight: 500,
                        fontFamily: "var(--font-poppins), sans-serif",
                        cursor: "pointer",
                        textDecoration: "none",
                        whiteSpace: "nowrap",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginTop: "12px",
                      }}
                    >
                      {notif.action.label}
                    </a>
                  )}
                </div>
              </div>

              {/* Action button - desktop only */}
              {notif.action && (
                <a
                  href={notif.action.href}
                  className="hidden sm:inline-flex"
                  style={{
                    backgroundColor: "#E8C96A",
                    color: "#060D1F",
                    borderRadius: "5px",
                    padding: "10px 28px",
                    fontSize: "clamp(13px, 1.3vw, 16px)",
                    fontWeight: 500,
                    fontFamily: "var(--font-poppins), sans-serif",
                    cursor: "pointer",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    alignItems: "center",
                    justifyContent: "center",
                    alignSelf: "flex-start",
                  }}
                >
                  {notif.action.label}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
