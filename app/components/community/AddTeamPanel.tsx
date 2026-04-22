"use client";

import { useEffect, useRef, useState } from "react";
import { IoClose, IoEarthOutline, IoLockClosedOutline, IoSearch } from "react-icons/io5";
import { FiUserPlus, FiCheck } from "react-icons/fi";
import { api } from "@/app/services/api";
import { useToast } from "@/app/context/ToastContext";
import type { Team } from "@/app/types/community";

interface AddTeamPanelProps {
  onClose: () => void;
  onCreated: (team: Team) => void;
}

interface SearchUser {
  id: number;
  username: string;
  name: string;
}

export default function AddTeamPanel({ onClose, onCreated }: AddTeamPanelProps) {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState<"public" | "private">("public");
  const [invited, setInvited] = useState<SearchUser[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const searchTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(async () => {
      try {
        const res = await api.teams.searchUsers(query.trim());
        if (res.success) {
          const users = (res.data as any)?.users || [];
          const invitedIds = new Set(invited.map(u => u.id));
          setResults(users.filter((u: SearchUser) => !invitedIds.has(u.id)));
        }
      } catch {
        // swallow
      } finally {
        setSearching(false);
      }
    }, 250);
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, [query, invited]);

  const invite = (u: SearchUser) => {
    setInvited(prev => prev.some(x => x.id === u.id) ? prev : [...prev, u]);
    setQuery("");
    setResults([]);
  };

  const removeInvite = (id: number) => {
    setInvited(prev => prev.filter(u => u.id !== id));
  };

  const handleSubmit = async () => {
    if (name.trim().length < 3) {
      showToast("Team name must be at least 3 characters", "error");
      return;
    }
    setSubmitting(true);
    try {
      const res = await api.teams.create({
        name: name.trim(),
        description: description.trim() || undefined,
        privacy,
        memberIds: invited.map(u => u.id),
      });
      if (res.success) {
        const team = (res.data as any)?.team as Team;
        showToast(`Team "${team.name}" created`, "success");
        onCreated(team);
      } else {
        showToast(res.message || "Could not create team", "error");
      }
    } catch {
      showToast("Could not create team", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#13192A",
        borderRadius: "8px",
        padding: "16px",
        marginBottom: "16px",
        border: "1px solid rgba(232,201,106,0.25)",
        fontFamily: "var(--font-poppins), sans-serif",
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: "14px" }}>
        <div style={{ color: "#E8C96A", fontWeight: 500, fontSize: "15px" }}>
          Create a team
        </div>
        <button
          onClick={onClose}
          disabled={submitting}
          style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: "4px" }}
          aria-label="Close"
        >
          <IoClose size={22} />
        </button>
      </div>

      <label style={labelStyle}>Team name</label>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Team Ryan"
        disabled={submitting}
        maxLength={50}
        style={inputStyle}
      />

      <label style={labelStyle}>Description (optional)</label>
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What is this team about?"
        rows={2}
        disabled={submitting}
        maxLength={200}
        style={{ ...inputStyle, resize: "vertical" }}
      />

      <label style={labelStyle}>Privacy</label>
      <div className="flex gap-2" style={{ marginBottom: "12px" }}>
        <button
          onClick={() => setPrivacy("public")}
          disabled={submitting}
          className="flex items-center gap-2"
          style={{ ...pillStyle, backgroundColor: privacy === "public" ? "rgba(232,201,106,0.15)" : "#060D1F", borderColor: privacy === "public" ? "#E8C96A" : "rgba(255,255,255,0.08)" }}
        >
          <IoEarthOutline size={14} />
          <span>Public</span>
        </button>
        <button
          onClick={() => setPrivacy("private")}
          disabled={submitting}
          className="flex items-center gap-2"
          style={{ ...pillStyle, backgroundColor: privacy === "private" ? "rgba(232,201,106,0.15)" : "#060D1F", borderColor: privacy === "private" ? "#E8C96A" : "rgba(255,255,255,0.08)" }}
        >
          <IoLockClosedOutline size={14} />
          <span>Private</span>
        </button>
      </div>
      <div style={{ color: "#888", fontSize: "11px", marginBottom: "14px", marginTop: "-4px" }}>
        {privacy === "public"
          ? "Anyone can join a public team."
          : "Private teams are invite-only. Only invited members can join."}
      </div>

      <label style={labelStyle}>Invite members (optional)</label>
      <div style={{ position: "relative", marginBottom: "10px" }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username or name..."
          disabled={submitting}
          style={{ ...inputStyle, paddingLeft: "34px", marginBottom: 0 }}
        />
        <IoSearch
          size={16}
          style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#888" }}
        />
        {(results.length > 0 || searching) && (
          <div style={{
            position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 10,
            backgroundColor: "#060D1F", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "6px", padding: "4px", maxHeight: "180px", overflowY: "auto",
          }}>
            {searching && results.length === 0 ? (
              <div style={{ color: "#888", fontSize: "12px", padding: "8px 10px" }}>Searching...</div>
            ) : results.map(u => (
              <button
                key={u.id}
                onClick={() => invite(u)}
                className="flex items-center gap-2"
                style={{
                  width: "100%", textAlign: "left", padding: "8px 10px",
                  borderRadius: "4px", border: "none", background: "none",
                  color: "#FFFFFF", fontSize: "13px", cursor: "pointer",
                }}
              >
                <FiUserPlus size={14} color="#E8C96A" />
                <span>{u.name}</span>
                <span style={{ color: "#888", fontSize: "11px" }}>@{u.username}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {invited.length > 0 && (
        <div className="flex flex-wrap gap-2" style={{ marginBottom: "14px" }}>
          {invited.map(u => (
            <div
              key={u.id}
              className="flex items-center gap-1"
              style={{
                backgroundColor: "rgba(232,201,106,0.12)",
                color: "#E8C96A",
                borderRadius: "999px",
                padding: "4px 8px",
                fontSize: "12px",
              }}
            >
              <FiCheck size={12} />
              <span>@{u.username}</span>
              <button
                onClick={() => removeInvite(u.id)}
                style={{ background: "none", border: "none", color: "#E8C96A", cursor: "pointer", padding: "0 4px" }}
                aria-label={`Remove ${u.username}`}
              >
                <IoClose size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-end gap-2" style={{ paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={onClose}
          disabled={submitting}
          style={{
            backgroundColor: "transparent", color: "#888",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: "5px",
            padding: "8px 16px", fontSize: "13px", cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || name.trim().length < 3}
          style={{
            backgroundColor: "#E8C96A", color: "#060D1F",
            border: "none", borderRadius: "5px",
            padding: "8px 22px", fontSize: "13px", fontWeight: 500,
            cursor: submitting || name.trim().length < 3 ? "not-allowed" : "pointer",
            opacity: submitting || name.trim().length < 3 ? 0.5 : 1,
            fontFamily: "inherit",
          }}
        >
          {submitting ? "Creating..." : "Create team"}
        </button>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block", color: "#E8C96A", fontSize: "12px",
  marginBottom: "6px", fontWeight: 500,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#060D1F",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: "5px",
  padding: "9px 12px",
  color: "#FFFFFF",
  fontSize: "13px",
  marginBottom: "12px",
  fontFamily: "inherit",
  outline: "none",
};

const pillStyle: React.CSSProperties = {
  padding: "7px 14px",
  borderRadius: "5px",
  border: "1px solid",
  color: "#FFFFFF",
  fontSize: "12px",
  cursor: "pointer",
  fontFamily: "inherit",
};
