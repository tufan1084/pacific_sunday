"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FiSearch, FiUser, FiUsers, FiLock, FiGlobe } from "react-icons/fi";
import { api, ApiSearchUser, ApiTeam } from "@/app/services/api";

type Results = { users: ApiSearchUser[]; teams: ApiTeam[] };

export default function GlobalSearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Results>({ users: [], teams: [] });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setResults({ users: [], teams: [] });
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.search.all(q.trim());
        if (res.success) {
          setResults((res.data as any) || { users: [], teams: [] });
        }
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [q]);

  const goToTeam = (team: ApiTeam) => {
    setOpen(false);
    setQ("");
    // Private non-member → preview page; otherwise community with filter
    if (team.privacy === "private" && !team.isMember) {
      router.push(`/team/${team.id}`);
    } else {
      router.push(`/community?team=${encodeURIComponent(team.name)}`);
    }
  };

  const goToUser = (u: ApiSearchUser) => {
    setOpen(false);
    setQ("");
    router.push(`/user/${u.id}`);
  };

  const hasResults = results.users.length > 0 || results.teams.length > 0;

  return (
    <div ref={rootRef} style={{ position: "relative", flex: 1, maxWidth: "420px" }}>
      <div
        style={{
          display: "flex", alignItems: "center", gap: "8px",
          backgroundColor: "#13192A",
          border: "1px solid #1E2A47",
          borderRadius: "8px",
          padding: "8px 12px",
        }}
      >
        <FiSearch size={16} color="#888" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search teams or users"
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            color: "#E8C96A", fontSize: "13px", fontFamily: "inherit",
          }}
        />
      </div>

      {open && q.trim().length >= 2 && (
        <div
          style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, zIndex: 50,
            backgroundColor: "#13192A",
            border: "1px solid #1E2A47",
            borderRadius: "8px",
            maxHeight: "420px", overflowY: "auto",
            boxShadow: "0 8px 28px rgba(0,0,0,0.6)",
          }}
        >
          {loading && (
            <div style={{ padding: "14px", color: "#888", fontSize: "12px", textAlign: "center" }}>
              Searching…
            </div>
          )}

          {!loading && !hasResults && (
            <div style={{ padding: "14px", color: "#888", fontSize: "12px", textAlign: "center" }}>
              No results for “{q}”
            </div>
          )}

          {!loading && results.teams.length > 0 && (
            <div>
              <div style={{ padding: "8px 14px", fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #1E2A47", display: "flex", alignItems: "center", gap: "6px" }}>
                <FiUsers size={12} /> Teams
              </div>
              {results.teams.map(t => (
                <button
                  key={`t-${t.id}`}
                  onClick={() => goToTeam(t)}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    width: "100%", padding: "10px 14px",
                    background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)",
                    color: "#E8C96A", fontSize: "13px", textAlign: "left", cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <div style={{ width: "30px", height: "30px", borderRadius: "5px", background: "#060D1F", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {t.privacy === "private" ? <FiLock size={14} /> : <FiGlobe size={14} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.name}</div>
                    <div style={{ color: "#888", fontSize: "11px", marginTop: "2px" }}>
                      {t.privacy === "private" ? "Private" : "Public"} · {t.memberCount} members
                    </div>
                  </div>
                  {t.privacy === "private" && !t.isMember && (
                    <span style={{ fontSize: "10px", color: "#888", border: "1px solid #1E2A47", borderRadius: "4px", padding: "2px 6px" }}>
                      Request
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {!loading && results.users.length > 0 && (
            <div>
              <div style={{ padding: "8px 14px", fontSize: "11px", color: "#888", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #1E2A47", display: "flex", alignItems: "center", gap: "6px" }}>
                <FiUser size={12} /> Users
              </div>
              {results.users.map(u => (
                <button
                  key={`u-${u.id}`}
                  onClick={() => goToUser(u)}
                  style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    width: "100%", padding: "10px 14px",
                    background: "none", border: "none", borderBottom: "1px solid rgba(255,255,255,0.05)",
                    color: "#E8C96A", fontSize: "13px", textAlign: "left", cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#060D1F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 700, flexShrink: 0 }}>
                    {u.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{u.name}</div>
                    <div style={{ color: "#888", fontSize: "11px", marginTop: "2px" }}>@{u.username}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
