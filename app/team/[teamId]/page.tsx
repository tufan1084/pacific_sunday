"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiLock, FiGlobe, FiArrowLeft } from "react-icons/fi";
import { api, ApiTeamDetail } from "@/app/services/api";
import { useToast } from "@/app/context/ToastContext";

export default function TeamPreviewPage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();

  const teamId = params?.teamId ? parseInt(params.teamId as string) : null;
  const [team, setTeam] = useState<ApiTeamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!teamId) return;
    loadTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const loadTeam = async () => {
    setLoading(true);
    try {
      const res = await api.teams.get(teamId!);
      if (res.success) {
        const t = (res.data as any)?.team as ApiTeamDetail;
        setTeam(t);
        // Members of the team → redirect to community with team filter
        if (t && t.isMember) {
          router.replace(`/community?team=${encodeURIComponent(t.name)}`);
          return;
        }
        // Public non-member → still show preview here with Join button
      } else {
        setError(res.message || "Team not found");
      }
    } catch (err) {
      setError("Failed to load team");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestJoin = async () => {
    if (!team) return;
    setBusy(true);
    try {
      const res = await api.teams.join(team.id);
      if (res.success) {
        if (team.privacy === "private") {
          toast.success("Join request sent — admin will review");
          setTeam({ ...team, hasPendingRequest: true });
        } else {
          toast.success("Joined team");
          router.push(`/community?team=${encodeURIComponent(team.name)}`);
        }
      } else {
        toast.error(res.message || "Failed to send request");
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", color: "#888", textAlign: "center", fontFamily: "var(--font-poppins), sans-serif" }}>
        Loading team…
      </div>
    );
  }

  if (error || !team) {
    return (
      <div style={{ padding: "40px", textAlign: "center", fontFamily: "var(--font-poppins), sans-serif" }}>
        <div style={{ color: "#F87171", fontSize: "15px", marginBottom: "12px" }}>{error || "Team not found"}</div>
        <button
          onClick={() => router.push("/community")}
          style={{ backgroundColor: "#E8C96A", color: "#060D1F", border: "none", borderRadius: "5px", padding: "10px 20px", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
        >
          Back to Community
        </button>
      </div>
    );
  }

  const canRequest = team.privacy === "private" && !team.isMember && !team.hasPendingRequest;
  const canJoinPublic = team.privacy === "public" && !team.isMember;

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "20px", fontFamily: "var(--font-poppins), sans-serif" }}>
      <button
        onClick={() => router.back()}
        style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#888", fontSize: "13px", cursor: "pointer", marginBottom: "20px" }}
      >
        <FiArrowLeft size={14} /> Back
      </button>

      <div style={{ backgroundColor: "#13192A", borderRadius: "8px", padding: "28px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
          <div style={{
            width: "64px", height: "64px", borderRadius: "8px",
            backgroundColor: "#060D1F",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#E8C96A", flexShrink: 0,
          }}>
            {team.privacy === "private" ? <FiLock size={24} /> : <FiGlobe size={24} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#E8C96A", fontSize: "20px", fontWeight: 500, marginBottom: "4px" }}>
              {team.name}
            </div>
            <div style={{ color: "#888", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
              <span>{team.privacy === "private" ? "Private team" : "Public team"}</span>
              <span>·</span>
              <span>{team.memberCount} members</span>
            </div>
          </div>
        </div>

        {team.description && (
          <div style={{ color: "#94A3B8", fontSize: "13px", lineHeight: 1.6, marginBottom: "20px" }}>
            {team.description}
          </div>
        )}

        {team.privacy === "private" && !team.isMember && (
          <div style={{ backgroundColor: "rgba(232,201,106,0.08)", border: "1px solid rgba(232,201,106,0.2)", borderRadius: "6px", padding: "12px", marginBottom: "20px" }}>
            <div style={{ color: "#E8C96A", fontSize: "12px", fontWeight: 500, marginBottom: "4px" }}>
              This team is private
            </div>
            <div style={{ color: "#888", fontSize: "11.5px", lineHeight: 1.5 }}>
              Posts and members are visible only to approved members. Send a request to join — a team admin will review it.
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          {canRequest && (
            <button
              onClick={handleRequestJoin}
              disabled={busy}
              style={{
                flex: 1,
                backgroundColor: "#E8C96A", color: "#060D1F",
                border: "none", borderRadius: "5px",
                padding: "12px", fontSize: "13px", fontWeight: 600,
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.6 : 1,
              }}
            >
              {busy ? "Sending…" : "Send join request"}
            </button>
          )}

          {team.privacy === "private" && !team.isMember && team.hasPendingRequest && (
            <div style={{
              flex: 1,
              backgroundColor: "transparent",
              color: "#888",
              border: "1px solid #1E2A47",
              borderRadius: "5px",
              padding: "12px", fontSize: "13px", fontWeight: 500,
              textAlign: "center",
            }}>
              Request pending — waiting for admin
            </div>
          )}

          {canJoinPublic && (
            <button
              onClick={handleRequestJoin}
              disabled={busy}
              style={{
                flex: 1,
                backgroundColor: "#E8C96A", color: "#060D1F",
                border: "none", borderRadius: "5px",
                padding: "12px", fontSize: "13px", fontWeight: 600,
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.6 : 1,
              }}
            >
              Join team
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
