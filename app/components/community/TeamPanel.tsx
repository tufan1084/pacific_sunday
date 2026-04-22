"use client";

import { useEffect, useState } from "react";
import { IoEarthOutline, IoLockClosedOutline, IoSettingsOutline, IoPersonAddOutline, IoNotificationsOutline } from "react-icons/io5";
import { api } from "@/app/services/api";
import type { Team, TeamMember } from "@/app/types/community";

interface TeamPanelProps {
  activeTeam: Team | null;
  onViewAll: (view?: "members" | "settings" | "invite" | "requests") => void;
  onJoin: (teamId: number) => void;
  onLeave: (teamId: number) => void;
  refreshToken?: number; // bump to re-fetch members
}

const dividerStyle = {
  height: "1.5px",
  backgroundColor: "rgba(255,255,255,0.15)",
  marginLeft: "-16px",
  marginRight: "-16px",
};

export default function TeamPanel({ activeTeam, onViewAll, onJoin, onLeave, refreshToken = 0 }: TeamPanelProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [joinRequestCount, setJoinRequestCount] = useState(0);

  const isAdmin = activeTeam?.role === "admin";

  useEffect(() => {
    if (!activeTeam) {
      setMembers([]);
      setJoinRequestCount(0);
      return;
    }
    let cancelled = false;
    setLoading(true);
    api.teams.get(activeTeam.id).then((res) => {
      if (cancelled) return;
      if (res.success) {
        const team = (res.data as any)?.team;
        setMembers((team?.members || []).slice(0, 4));
      } else {
        setMembers([]);
      }
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    // Load join requests count for admin
    if (isAdmin && activeTeam.privacy === "private") {
      api.teams.getJoinRequests(activeTeam.id).then((res) => {
        if (cancelled) return;
        if (res.success) {
          const requests = (res.data as any)?.requests || [];
          setJoinRequestCount(requests.length);
        }
      });
    }

    return () => { cancelled = true; };
  }, [activeTeam?.id, refreshToken, isAdmin]);

  if (!activeTeam) {
    return (
      <div
        style={{
          backgroundColor: "#13192A",
          borderRadius: "5px",
          padding: "20px 16px",
          fontFamily: "var(--font-poppins), sans-serif",
        }}
      >
        <div style={{ paddingBottom: "12px", paddingTop: "4px" }}>
          <span style={{ fontSize: "16px", color: "#E8C96A", fontWeight: 500 }}>Suggested for you</span>
        </div>
        <div style={{ color: "#888", fontSize: "13px", lineHeight: "1.5" }}>
          Join a team to see focused posts, share picks, and connect with other owners. Try selecting a team from the filter above — or create your own.
        </div>
      </div>
    );
  }

  const handleJoinLeave = async () => {
    setBusy(true);
    try {
      if (activeTeam.isMember) {
        await onLeave(activeTeam.id);
      } else {
        await onJoin(activeTeam.id);
      }
    } finally {
      setBusy(false);
    }
  };

  const canJoin = activeTeam.privacy === "public" && !activeTeam.isMember;
  const canLeave = activeTeam.isMember && activeTeam.role !== "admin";

  return (
    <div
      style={{
        backgroundColor: "#13192A",
        borderRadius: "5px",
        padding: "20px 16px",
        fontFamily: "var(--font-poppins), sans-serif",
      }}
    >
      <div className="flex items-center justify-between" style={{ paddingBottom: "14px", paddingTop: "4px" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{
            fontSize: "15px", color: "#E8C96A", fontWeight: 500,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {activeTeam.name}
          </div>
          <div className="flex items-center gap-1" style={{ color: "#888", fontSize: "11px", marginTop: "2px" }}>
            {activeTeam.privacy === "public"
              ? <><IoEarthOutline size={11} /><span>Public</span></>
              : <><IoLockClosedOutline size={11} /><span>Private</span></>
            }
            <span>· {activeTeam.memberCount} members</span>
          </div>
        </div>
        {activeTeam.role === "admin" && (
          <div style={{ display: "flex", gap: "8px", marginLeft: "8px" }}>
            <button
              onClick={() => onViewAll("settings")}
              style={{ background: "none", border: "none", color: "#E8C96A", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
              title="Settings"
            >
              <IoSettingsOutline size={18} />
            </button>
            <button
              onClick={() => onViewAll("invite")}
              style={{ background: "none", border: "none", color: "#E8C96A", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
              title="Invite Members"
            >
              <IoPersonAddOutline size={18} />
            </button>
            {activeTeam.privacy === "private" && joinRequestCount > 0 && (
              <button
                onClick={() => onViewAll("requests")}
                style={{ background: "none", border: "none", color: "#E8C96A", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center", position: "relative" }}
                title="Join Requests"
              >
                <IoNotificationsOutline size={18} />
                <span style={{ position: "absolute", top: "0", right: "0", backgroundColor: "#F87171", color: "#FFF", fontSize: "9px", fontWeight: 700, borderRadius: "10px", padding: "2px 4px", minWidth: "14px", textAlign: "center" }}>{joinRequestCount}</span>
              </button>
            )}
          </div>
        )}
      </div>
      {activeTeam.description && (
        <div style={{ color: "#94A3B8", fontSize: "12px", marginBottom: "10px", lineHeight: 1.5 }}>
          {activeTeam.description}
        </div>
      )}
      <div style={dividerStyle} />

      {loading ? (
        <div style={{ color: "#888", fontSize: "12px", paddingTop: "12px" }}>Loading members...</div>
      ) : members.length === 0 ? (
        <div style={{ color: "#888", fontSize: "12px", paddingTop: "12px" }}>No members yet.</div>
      ) : members.map((m, i) => (
        <div key={m.id}>
          <div className="flex items-center gap-3" style={{ paddingTop: "10px", paddingBottom: "10px" }}>
            <div
              style={{
                width: "34px", height: "34px", borderRadius: "5px",
                backgroundColor: "#060D1F", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: "10px", fontWeight: 700,
                color: "#E8C96A", flexShrink: 0,
              }}
            >
              {m.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ color: "#E8C96A", fontWeight: 500, fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {m.name}
              </div>
              <div style={{ color: "#888888", fontSize: "12px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                @{m.username}
              </div>
            </div>
            {m.role === "admin" && (
              <span style={{ fontSize: "10px", color: "#060D1F", backgroundColor: "#E8C96A", padding: "3px 8px", borderRadius: "3px", fontWeight: 600, marginLeft: "8px", flexShrink: 0 }}>
                Admin
              </span>
            )}
          </div>
          {i < members.length - 1 && <div style={dividerStyle} />}
        </div>
      ))}

      <div className="flex gap-2" style={{ marginTop: "14px" }}>
        <button
          onClick={() => onViewAll("members")}
          style={{
            flex: 1,
            border: "1px solid #E8C96A", color: "#060D1F",
            backgroundColor: "#E8C96A",
            padding: "10px 12px", borderRadius: "5px",
            fontSize: "13px", fontWeight: 500,
            cursor: "pointer",
            fontFamily: "var(--font-poppins), sans-serif",
          }}
        >
          View all members
        </button>
        {(canJoin || canLeave) && (
          <button
            onClick={handleJoinLeave}
            disabled={busy}
            style={{
              backgroundColor: "transparent",
              border: `1px solid ${canLeave ? "#F87171" : "#E8C96A"}`,
              color: canLeave ? "#F87171" : "#E8C96A",
              padding: "10px 14px", borderRadius: "5px",
              fontSize: "13px", fontWeight: 500,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.6 : 1,
              fontFamily: "var(--font-poppins), sans-serif",
            }}
          >
            {canLeave ? "Leave" : "Join"}
          </button>
        )}
      </div>
    </div>
  );
}
