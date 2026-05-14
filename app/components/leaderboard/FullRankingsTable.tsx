"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { api } from "@/app/services/api";

const thStyle: React.CSSProperties = {
  color: "#FFFFFF",
  fontSize: "16px",
  fontWeight: 400,
  padding: "8px 16px",
  textAlign: "left",
  backgroundColor: "#1D2640",
  fontFamily: "var(--font-poppins), sans-serif",
  whiteSpace: "nowrap",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
};

interface LeaderboardEntry {
  rank: number;
  userId: number;
  username: string;
  name: string;
  country: string | null;
  bagName: string | null;
  points: number;
  weeksRegistered: number;
  streak: number;
  isCurrentUser: boolean;
}

const ITEMS_PER_PAGE = 2;

export default function FullRankingsTable() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveTournament, setLiveTournament] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const currentUserId = typeof window !== "undefined" 
    ? parseInt(localStorage.getItem("ps_user_id") || "0") 
    : 0;

  useEffect(() => {
    const loadData = async () => {
      try {
        // Check for live tournament
        const tournamentsRes = await api.golf.getTournaments();
        if (tournamentsRes.success && tournamentsRes.data) {
          const data = tournamentsRes.data as { live: any[] };
          setLiveTournament(data.live?.[0] || null);
        }

        // Fetch leaderboard data
        const leaderboardRes = await api.leaderboard.getAll();
        if (leaderboardRes.success && leaderboardRes.data) {
          setLeaderboard(leaderboardRes.data.leaderboard || []);
        }
      } catch (error) {
        console.error("Failed to load leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUserId]);

  if (loading) {
    return (
      <div style={{ backgroundColor: "#13192A", borderRadius: "5px", marginTop: "24px", padding: "40px", textAlign: "center", fontFamily: "var(--font-poppins), sans-serif" }}>
        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>Loading rankings...</div>
      </div>
    );
  }

  // Pagination calculations
  const totalPages = Math.ceil(leaderboard.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedData = leaderboard.slice(startIndex, endIndex);

  return (
    <div style={{ backgroundColor: "#13192A", borderRadius: "5px", marginTop: "24px", fontFamily: "var(--font-poppins), sans-serif" }}>
      {/* Header */}
      <div className="flex items-center justify-between" style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="flex items-center gap-2">
          <Image src="/icons/bar-chat.svg" alt="rankings" width={32} height={32} />
          <span style={{ color: "#E8C96A", fontSize: "18px", fontWeight: 400 }}>Full Rankings</span>
        </div>
        {liveTournament && (
          <div className="flex items-center gap-2">
            <Image src="/icons/nfc.svg" alt="live" width={18} height={18} />
            <span style={{ color: "#74FF6D", fontSize: "clamp(13px, 1.3vw, 15px)", fontWeight: 400 }}>Live</span>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="leaderboard-scroll" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px" }}>
          <thead>
            <tr>
              <th style={thStyle}>Rank</th>
              <th style={thStyle}>Owner</th>
              <th style={thStyle}>Country</th>
              <th style={thStyle}>Bag</th>
              <th style={{ ...thStyle, textAlign: "right" }}>Points</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Weeks</th>
              <th style={{ ...thStyle, textAlign: "center" }}>Streak</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "40px 20px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>
                  No rankings data available
                </td>
              </tr>
            ) : (
              paginatedData.map((row, i) => {
                const gold = row.isCurrentUser ? "#E8C96A" : "#FFFFFF";
                const rowBg = row.isCurrentUser ? "rgba(232,201,106,0.08)" : "transparent";
                const tdStyle: React.CSSProperties = {
                  fontSize: "15px",
                  fontWeight: row.isCurrentUser ? 500 : 400,
                  padding: "10px 16px",
                  color: gold,
                  fontFamily: "var(--font-poppins), sans-serif",
                  whiteSpace: "nowrap",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  backgroundColor: rowBg,
                };
                return (
                  <tr key={row.userId}>
                    <td style={tdStyle}>{row.rank}.</td>
                    <td style={tdStyle}>
                      <div>
                        <div style={{ fontWeight: row.isCurrentUser ? 600 : 500 }}>{row.name}</div>
                        <div style={{ fontSize: "12px", color: row.isCurrentUser ? "rgba(232,201,106,0.7)" : "rgba(255,255,255,0.5)", marginTop: "2px" }}>@{row.username}</div>
                      </div>
                    </td>
                    <td style={tdStyle}>{row.country || "—"}</td>
                    <td style={tdStyle}>{row.bagName || "—"}</td>
                    <td style={{ ...tdStyle, textAlign: "right", fontWeight: row.isCurrentUser ? 600 : 500 }}>{row.points.toLocaleString()}</td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>{row.weeksRegistered}</td>
                    <td style={{ ...tdStyle, textAlign: "center" }}>
                      <span className="flex items-center justify-center gap-1">
                        {row.streak}
                        <Image 
                          src="/icons/streak.svg" 
                          alt="streak" 
                          width={20} 
                          height={20} 
                          style={{ 
                            filter: row.isCurrentUser 
                              ? "brightness(0) saturate(100%) invert(82%) sepia(30%) saturate(800%) hue-rotate(5deg) brightness(100%)" 
                              : undefined 
                          }} 
                        />
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between" style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px" }}>
            Showing {startIndex + 1}-{Math.min(endIndex, leaderboard.length)} of {leaderboard.length}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: "8px 12px",
                backgroundColor: currentPage === 1 ? "rgba(255,255,255,0.05)" : "#E8C96A",
                color: currentPage === 1 ? "rgba(255,255,255,0.3)" : "#060D1F",
                border: "none",
                borderRadius: "5px",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: 500,
                fontFamily: "var(--font-poppins), sans-serif",
              }}
            >
              Previous
            </button>
            <div style={{ color: "#FFFFFF", fontSize: "14px", padding: "0 12px" }}>
              Page {currentPage} of {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: "8px 12px",
                backgroundColor: currentPage === totalPages ? "rgba(255,255,255,0.05)" : "#E8C96A",
                color: currentPage === totalPages ? "rgba(255,255,255,0.3)" : "#060D1F",
                border: "none",
                borderRadius: "5px",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                fontSize: "14px",
                fontWeight: 500,
                fontFamily: "var(--font-poppins), sans-serif",
              }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
