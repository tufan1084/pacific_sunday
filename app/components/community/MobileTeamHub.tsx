"use client";

import Image from "next/image";
import {
  IoAddOutline,
  IoEarthOutline,
  IoLockClosedOutline,
  IoPeopleOutline,
  IoChevronForwardOutline,
  IoSettingsOutline,
  IoPersonAddOutline,
} from "react-icons/io5";
import type { Team } from "@/app/types/community";

interface CommunityStats {
  postsThisWeek: number | null;
  activeOwners: number | null;
  nfcScansToday: number | null;
}

interface MobileTeamHubProps {
  teams: Team[];
  stats: CommunityStats | null;
  activeTeam: Team | null;
  onCreateTeam: () => void;
  onSelectTeam: (team: Team) => void;
  onViewTeam: (team: Team, view?: "members" | "settings" | "invite") => void;
}

const divider = (
  <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.08)" }} />
);

const fmt = (n: number | null | undefined) =>
  n == null ? "—" : n.toLocaleString("en-US");

export default function MobileTeamHub({
  teams,
  stats,
  activeTeam,
  onCreateTeam,
  onSelectTeam,
  onViewTeam,
}: MobileTeamHubProps) {
  const myTeams = teams.filter((t) => t.isMember);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontFamily: "var(--font-poppins), sans-serif" }}>

      {/* Create team CTA */}
      <button
        onClick={onCreateTeam}
        className="flex items-center justify-center gap-2"
        style={{
          width: "100%",
          backgroundColor: "#E8C96A",
          color: "#060D1F",
          border: "none",
          borderRadius: "8px",
          padding: "12px 16px",
          fontSize: "14px",
          fontWeight: 600,
          cursor: "pointer",
          fontFamily: "inherit",
        }}
      >
        <IoAddOutline size={18} />
        Create a team
      </button>

      {/* My Teams */}
      <div style={{ backgroundColor: "#13192A", borderRadius: "8px", overflow: "hidden" }}>
        <div
          className="flex items-center justify-between"
          style={{ padding: "12px 14px 10px" }}
        >
          <span style={{ color: "#E8C96A", fontSize: "13px", fontWeight: 600 }}>
            My Teams
          </span>
          <span style={{ color: "#888", fontSize: "11px" }}>
            {myTeams.length} team{myTeams.length !== 1 ? "s" : ""}
          </span>
        </div>
        {divider}

        {myTeams.length === 0 ? (
          <div style={{ padding: "16px 14px", color: "#888", fontSize: "12px", lineHeight: 1.5 }}>
            You haven't joined any teams yet. Create one or join a public team from the filter above.
          </div>
        ) : (
          myTeams.map((team, i) => (
            <div key={team.id}>
              <div
                className="flex items-center gap-3"
                style={{
                  padding: "10px 14px",
                  backgroundColor: activeTeam?.id === team.id ? "rgba(232,201,106,0.07)" : "transparent",
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    width: "36px", height: "36px", borderRadius: "6px",
                    backgroundColor: team.imageUrl ? "#060D1F" : "rgba(232,201,106,0.12)",
                    overflow: "hidden", flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  {team.imageUrl ? (
                    <Image src={team.imageUrl} alt="" width={36} height={36}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }} unoptimized />
                  ) : (
                    <IoPeopleOutline size={18} color="#E8C96A" />
                  )}
                </div>

                {/* Info — tapping selects the team filter */}
                <button
                  onClick={() => onSelectTeam(team)}
                  style={{
                    flex: 1, minWidth: 0, background: "none", border: "none",
                    textAlign: "left", cursor: "pointer", padding: 0,
                  }}
                >
                  <div style={{
                    color: activeTeam?.id === team.id ? "#E8C96A" : "#FFFFFF",
                    fontSize: "13px", fontWeight: 500,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}>
                    {team.name}
                  </div>
                  <div className="flex items-center gap-1" style={{ color: "#888", fontSize: "11px", marginTop: "2px" }}>
                    {team.privacy === "public"
                      ? <><IoEarthOutline size={10} /><span>Public</span></>
                      : <><IoLockClosedOutline size={10} /><span>Private</span></>
                    }
                    <span>· {team.memberCount} members</span>
                    {team.role === "admin" && (
                      <span style={{
                        backgroundColor: "#E8C96A", color: "#060D1F",
                        fontSize: "9px", fontWeight: 700, borderRadius: "3px",
                        padding: "1px 5px", marginLeft: "2px",
                      }}>Admin</span>
                    )}
                  </div>
                </button>

                {/* Action icons */}
                <div className="flex items-center gap-1" style={{ flexShrink: 0 }}>
                  {team.role === "admin" && (
                    <>
                      <button
                        onClick={() => onViewTeam(team, "invite")}
                        style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: "4px" }}
                        title="Invite"
                      >
                        <IoPersonAddOutline size={16} />
                      </button>
                      <button
                        onClick={() => onViewTeam(team, "settings")}
                        style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: "4px" }}
                        title="Settings"
                      >
                        <IoSettingsOutline size={16} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => onViewTeam(team, "members")}
                    style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: "4px" }}
                    title="View members"
                  >
                    <IoChevronForwardOutline size={16} />
                  </button>
                </div>
              </div>
              {i < myTeams.length - 1 && divider}
            </div>
          ))
        )}
      </div>

      {/* Community Status */}
      <div style={{ backgroundColor: "#13192A", borderRadius: "8px", overflow: "hidden" }}>
        <div style={{ padding: "12px 14px 10px" }}>
          <span style={{ color: "#E8C96A", fontSize: "13px", fontWeight: 600 }}>Community Status</span>
        </div>
        {divider}
        <div className="flex items-stretch" style={{ padding: "12px 0" }}>
          {[
            { label: "Posts this week", value: fmt(stats?.postsThisWeek) },
            { label: "Active owners", value: fmt(stats?.activeOwners) },
            { label: "NFC scans today", value: fmt(stats?.nfcScansToday) },
          ].map((cell, i) => (
            <div
              key={cell.label}
              style={{
                flex: 1, minWidth: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                textAlign: "center", padding: "4px 8px",
                borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.08)" : "none",
              }}
            >
              <div style={{ color: "#E8C96A", fontSize: "18px", fontWeight: 700, lineHeight: 1.1 }}>
                {cell.value}
              </div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", marginTop: "4px", lineHeight: 1.2 }}>
                {cell.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
