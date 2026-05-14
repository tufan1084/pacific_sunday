"use client";

import { useEffect, useMemo, useState, use } from "react";
import { useRouter } from "next/navigation";
import { io } from "socket.io-client";
import { api } from "@/app/services/api";
import { SOCKET_URL } from "@/app/lib/constants";
import type { ApiH2HChallenge, ApiH2HFieldPlayer } from "@/app/services/api";
import type { User } from "@/app/types";

const TEAM_SIZE = 10;

const initialsFromName = (n?: string | null) =>
  (n || "?").trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase()).join("");

export default function SelectTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const challengeId = Number(id);
  const router = useRouter();

  const [me, setMe] = useState<User | null>(null);
  const [challenge, setChallenge] = useState<ApiH2HChallenge | null>(null);
  const [field, setField] = useState<ApiH2HFieldPlayer[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<"save" | "lock" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [meRes, chRes, fieldRes] = await Promise.all([
        api.auth.me(),
        api.h2h.getChallenge(challengeId),
        api.h2h.getField(challengeId),
      ]);
      if (meRes.success && meRes.data) setMe(meRes.data.user);
      if (chRes.success && chRes.data) {
        setChallenge(chRes.data.challenge);
        if (chRes.data.challenge.yourPick?.playerIds) {
          setPicked(new Set(chRes.data.challenge.yourPick.playerIds));
        }
      } else if (!chRes.success) {
        setError(chRes.message || "Failed to load challenge");
      }
      if (fieldRes.success && fieldRes.data) setField(fieldRes.data.players);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [challengeId]);

  // Socket: reload when both teams lock so the side-by-side view appears instantly
  useEffect(() => {
    const userId = typeof window !== "undefined" ? parseInt(localStorage.getItem("ps_user_id") || "0") : 0;
    if (!userId) return;
    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socket.on("connect", () => socket.emit("user:identify", { userId }));
    socket.on("h2h:bothLocked", ({ challengeId: cid }: { challengeId: number }) => {
      if (cid === challengeId) load();
    });
    // Live polling — refresh every 30s when tournament is live
    const t = setInterval(() => {
      if (challenge?.status === "LIVE" || challenge?.tournament?.status === "live") load();
    }, 30000);
    return () => { socket.disconnect(); clearInterval(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [challengeId, challenge?.status, challenge?.tournament?.status]);

  const yourLocked = !!challenge?.yourPick?.lockedAt;
  const opponentLocked = !!challenge?.opponentPick?.lockedAt;
  const fieldReady = !!challenge?.tournament?.fieldAvailable;
  const tournamentLive = challenge?.tournament?.status === "live" || challenge?.tournament?.status === "completed";
  const showLiveMatchup = yourLocked && opponentLocked && tournamentLive;

  const filteredField = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return field;
    return field.filter(
      (p) =>
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
        (p.country || "").toLowerCase().includes(q),
    );
  }, [field, filter]);

  const togglePick = (playerId: string) => {
    if (yourLocked) return;
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(playerId)) next.delete(playerId);
      else if (next.size < TEAM_SIZE) next.add(playerId);
      return next;
    });
  };

  const submit = async (action: "save" | "lock") => {
    if (action === "lock" && picked.size !== TEAM_SIZE) {
      setError(`Pick exactly ${TEAM_SIZE} players to lock`);
      return;
    }
    setSubmitting(action);
    setError(null);
    try {
      const ids = Array.from(picked);
      const res = action === "save"
        ? await api.h2h.savePicks(challengeId, ids)
        : await api.h2h.lockPicks(challengeId, ids);
      if (!res.success) throw new Error(res.message || `${action} failed`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : `${action} failed`);
    } finally {
      setSubmitting(null);
    }
  };

  if (loading) {
    return <div className="p-6 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>Loading challenge…</div>;
  }
  if (!challenge) {
    return <div className="p-6 text-sm" style={{ color: "#F87171" }}>{error || "Challenge not found"}</div>;
  }

  const them = challenge.role === "challenger" ? challenge.opponent : challenge.challenger;

  return (
    <div className="font-[var(--font-poppins),sans-serif]">
      {/* Header */}
      <div className="mb-5">
        <button
          onClick={() => router.push("/head-to-head")}
          className="text-xs mb-2 bg-transparent border-0 cursor-pointer p-0"
          style={{ color: "rgba(255,255,255,0.6)" }}
        >
          ← Back to challenges
        </button>
        <h1 className="font-semibold mb-2" style={{ color: "#E8C96A", fontSize: "clamp(18px, 2.5vw, 22px)" }}>
          {showLiveMatchup ? "Live Matchup" : "Pick Your Team"}
        </h1>
        <div className="text-sm flex flex-wrap items-center gap-1" style={{ color: "rgba(255,255,255,0.8)" }}>
          <span>{challenge.tournament?.name}</span>
          {challenge.multiplier !== 1 && (
            <span style={{ color: "#E8C96A" }}>· {challenge.multiplier}x</span>
          )}
          <span style={{ color: "rgba(255,255,255,0.6)" }}>· {challenge.effectiveWager} pts at stake</span>
        </div>
      </div>

      {/* Live Matchup */}
      {showLiveMatchup && (
        <LiveMatchup challenge={challenge} viewerId={me?.id ?? null} />
      )}

      {/* Picker (or locked summary) */}
      {!showLiveMatchup && (
        <>
          {/* VS Status Banner */}
          <div className="rounded-md mb-6 p-4 sm:p-5" style={{ backgroundColor: "#13192A" }}>
            <div className="flex items-center justify-center gap-3 sm:gap-5">
              {/* You */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <Avatar
                  photoUrl={me?.photoUrl}
                  name={me?.name || me?.username || "You"}
                  locked={yourLocked}
                />
                <div className="min-w-0">
                  <div className="font-semibold text-xs sm:text-sm truncate" style={{ color: "#E8C96A" }}>
                    {me?.name || me?.username || "You"}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: yourLocked ? "#4ADE80" : "rgba(255,255,255,0.5)" }}>
                    {yourLocked ? "✓ Locked" : `${picked.size}/${TEAM_SIZE}`}
                  </div>
                </div>
              </div>

              {/* VS */}
              <div
                className="px-3 py-2 rounded-md flex-shrink-0 text-sm font-bold tracking-wide"
                style={{ background: "rgba(232,201,106,0.1)", border: "1px solid rgba(232,201,106,0.3)", color: "#E8C96A" }}
              >
                VS
              </div>

              {/* Opponent */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <Avatar
                  photoUrl={them?.photoUrl}
                  name={them?.name || "Opponent"}
                  locked={opponentLocked}
                />
                <div className="min-w-0">
                  <div className="font-semibold text-xs sm:text-sm truncate" style={{ color: "#fff" }}>
                    {them?.name || "Opponent"}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: opponentLocked ? "#4ADE80" : "rgba(255,255,255,0.5)" }}>
                    {opponentLocked ? "✓ Locked" : "Picking..."}
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <div
                className="mt-3 px-3 py-2 rounded text-xs sm:text-sm"
                style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.3)", color: "#F87171" }}
              >
                {error}
              </div>
            )}
          </div>

          {/* Both Locked — show teams side by side */}
          {yourLocked && !showLiveMatchup && (
            <ViewTeams challenge={challenge} field={field} them={them} />
          )}

          {/* Player Picker */}
          {!yourLocked && !fieldReady && (
            <div className="rounded-md p-8 text-center mb-6" style={{ backgroundColor: "#13192A" }}>
              <div className="font-semibold text-base mb-1.5" style={{ color: "#E8C96A" }}>
                Player data not available yet
              </div>
              <div className="text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                The tournament field publishes the Monday before the event. Check back then to pick your team.
              </div>
            </div>
          )}

          {!yourLocked && fieldReady && (
            <div className="rounded-md p-4 sm:p-5 mb-6" style={{ backgroundColor: "#13192A" }}>
              {/* Search */}
              <input
                type="text"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Search players…"
                className="w-full px-3 py-2 mb-3 rounded text-sm outline-none"
                style={{
                  background: "#182037", color: "#fff",
                  border: "1px solid rgba(255,255,255,0.1)",
                  fontFamily: "inherit",
                }}
              />

              {/* Player grid */}
              <div
                className="grid gap-1.5 overflow-y-auto"
                style={{
                  gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 220px), 1fr))",
                  maxHeight: 400,
                }}
              >
                {filteredField.map((p) => {
                  const isPicked = picked.has(p.playerId);
                  const atLimit = !isPicked && picked.size >= TEAM_SIZE;
                  return (
                    <button
                      key={p.playerId}
                      onClick={() => togglePick(p.playerId)}
                      disabled={yourLocked || (atLimit && !isPicked)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded text-left w-full"
                      style={{
                        background: isPicked ? "rgba(232,201,106,0.12)" : "rgba(255,255,255,0.02)",
                        border: `1px solid ${isPicked ? "#E8C96A" : "rgba(255,255,255,0.06)"}`,
                        cursor: yourLocked || (atLimit && !isPicked) ? "not-allowed" : "pointer",
                        opacity: atLimit && !isPicked ? 0.45 : 1,
                        fontFamily: "inherit",
                        color: "#fff",
                      }}
                    >
                      <div
                        className="flex-shrink-0 flex items-center justify-center rounded"
                        style={{
                          width: 18, height: 18,
                          border: `2px solid ${isPicked ? "#E8C96A" : "rgba(255,255,255,0.2)"}`,
                          background: isPicked ? "#E8C96A" : "transparent",
                        }}
                      >
                        {isPicked && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#060D1F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-medium truncate">{p.firstName} {p.lastName}</div>
                        <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                          {p.tier}{p.owgrRank ? ` · #${p.owgrRank}` : ""}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action row */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-3">
                <div className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {picked.size} of {TEAM_SIZE} selected
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => submit("save")}
                    disabled={!!submitting || picked.size === 0}
                    className="px-4 py-2 rounded text-xs font-medium"
                    style={{
                      background: "transparent", color: "#fff",
                      border: "1px solid rgba(255,255,255,0.2)",
                      cursor: submitting || picked.size === 0 ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                    }}
                  >
                    {submitting === "save" ? "Saving…" : "Save Draft"}
                  </button>
                  <button
                    onClick={() => submit("lock")}
                    disabled={!!submitting || picked.size !== TEAM_SIZE}
                    className="px-4 py-2 rounded text-xs font-semibold"
                    style={{
                      background: picked.size === TEAM_SIZE ? "#E8C96A" : "rgba(232,201,106,0.4)",
                      color: "#060D1F", border: "none",
                      cursor: picked.size === TEAM_SIZE && !submitting ? "pointer" : "not-allowed",
                      fontFamily: "inherit",
                    }}
                  >
                    {submitting === "lock" ? "Locking…" : "Lock Team"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Shared Avatar ────────────────────────────────────────────────────────────
function Avatar({ photoUrl, name, locked }: { photoUrl?: string | null; name: string; locked: boolean }) {
  return (
    <div
      className="flex-shrink-0 flex items-center justify-center rounded overflow-hidden text-sm font-bold"
      style={{
        width: 44, height: 44,
        background: "#060D1F",
        color: "#E8C96A",
        border: locked ? "2px solid #4ADE80" : "2px solid rgba(232,201,106,0.3)",
      }}
    >
      {photoUrl
        ? <img src={photoUrl} alt={name} className="w-full h-full object-cover" />
        : initialsFromName(name)}
    </div>
  );
}

// ─── ViewTeams (both locked, pre-tournament) ──────────────────────────────────
function ViewTeams({ challenge, field, them }: {
  challenge: ApiH2HChallenge;
  field: ApiH2HFieldPlayer[];
  them: { id?: number; name?: string | null; photoUrl?: string | null } | null | undefined;
}) {
  const yourPlayerIds = challenge.yourPick?.playerIds || [];
  const opponentPlayerIds = challenge.opponentPick?.playerIds || [];
  const opponentLocked = !!challenge.opponentPick?.lockedAt;
  const tournamentLive = challenge.tournament?.status === "live" || challenge.tournament?.status === "completed";

  const yourPlayers = yourPlayerIds.slice(0, 10)
    .map((id) => field.find((p) => p.playerId === id))
    .filter(Boolean) as ApiH2HFieldPlayer[];

  const opponentPlayers = opponentPlayerIds.slice(0, 10)
    .map((id) => field.find((p) => p.playerId === id))
    .filter(Boolean) as ApiH2HFieldPlayer[];

  return (
    <div className="rounded-md p-4 sm:p-5 mb-6" style={{ backgroundColor: "#13192A" }}>
      {/* Section title */}
      <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
        {opponentLocked ? "Both teams locked - teams are revealed" : "Your team locked - waiting for opponent"}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        {/* Your Team */}
        <div>
          <div className="mb-3 pb-2" style={{ borderBottom: "1px solid rgba(232,201,106,0.3)" }}>
            <div className="font-semibold text-sm" style={{ color: "#E8C96A" }}>Your Team</div>
            <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{yourPlayers.length} players</div>
          </div>
          <div className="flex flex-col gap-1.5">
            {yourPlayers.length > 0 ? yourPlayers.map((p, idx) => (
              <TeamPlayerRow key={p.playerId} player={p} idx={idx} variant="you" />
            )) : (
              <div className="text-xs text-center py-5" style={{ color: "rgba(255,255,255,0.5)" }}>No players selected</div>
            )}
          </div>
        </div>

        {/* Opponent Team */}
        <div>
          <div className="mb-3 pb-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.15)" }}>
            <div className="font-semibold text-sm truncate" style={{ color: "#fff" }}>
              {them?.name || "Opponent"}&apos;s Team
            </div>
            <div className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>{opponentPlayers.length} players</div>
          </div>
          <div className="flex flex-col gap-1.5">
            {opponentPlayers.length > 0 ? opponentPlayers.map((p, idx) => (
              <TeamPlayerRow key={p.playerId} player={p} idx={idx} variant="opponent" />
            )) : (
              <div className="text-xs text-center py-5" style={{ color: "rgba(255,255,255,0.5)" }}>
                {!opponentLocked
                  ? tournamentLive
                    ? "Opponent did not lock before the tournament started"
                    : "Waiting for opponent to lock their team"
                  : "Team locked - hidden until tournament starts"}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamPlayerRow({ player, idx, variant }: {
  player: ApiH2HFieldPlayer;
  idx: number;
  variant: "you" | "opponent";
}) {
  const isYou = variant === "you";
  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded"
      style={{
        background: isYou ? "rgba(232,201,106,0.08)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${isYou ? "rgba(232,201,106,0.2)" : "rgba(255,255,255,0.08)"}`,
      }}
    >
      <div className="text-[11px] font-semibold flex-shrink-0 w-5" style={{ color: isYou ? "#E8C96A" : "rgba(255,255,255,0.4)" }}>
        {idx + 1}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs font-medium truncate" style={{ color: "#fff" }}>
          {player.firstName} {player.lastName}
        </div>
        <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.45)" }}>
          {player.tier}{player.owgrRank ? ` · #${player.owgrRank}` : ""}
        </div>
      </div>
    </div>
  );
}

// ─── LiveMatchup (tournament live/completed) ──────────────────────────────────
function LiveMatchup({ challenge, viewerId }: { challenge: ApiH2HChallenge; viewerId: number | null }) {
  const youAreChallenger = challenge.challenger?.id === viewerId;
  const yourScore = challenge.yourScore;
  const oppScore = challenge.opponentScore;
  const yourLeads = yourScore && oppScore && yourScore.total < oppScore.total;
  const oppLeads = yourScore && oppScore && oppScore.total < yourScore.total;
  const them = youAreChallenger ? challenge.opponent : challenge.challenger;

  return (
    <div className="rounded-md p-4 sm:p-5 mb-6" style={{ backgroundColor: "#13192A" }}>
      {/* Score row — stacks on very small screens */}
      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr auto 1fr" }}>
        <ScoreColumn name="You" totalStrokes={yourScore?.total ?? null} leads={!!yourLeads} breakdown={yourScore?.breakdown} />
        <div className="flex flex-col items-center justify-center px-2">
          <div className="text-lg sm:text-2xl font-semibold" style={{ color: "#fff" }}>VS</div>
          <div className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>lower wins</div>
        </div>
        <ScoreColumn name={them?.name || "Opponent"} totalStrokes={oppScore?.total ?? null} leads={!!oppLeads} breakdown={oppScore?.breakdown} />
      </div>

      {challenge.status === "COMPLETED" && (
        <div
          className="mt-4 text-center px-4 py-3 rounded text-sm font-semibold"
          style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ADE80" }}
        >
          {challenge.winnerId === viewerId
            ? `You won +${challenge.effectiveWager} pts`
            : challenge.winnerId === null
              ? `Tied — ${challenge.effectiveWager} pts refunded to each side`
              : `Lost -${challenge.effectiveWager} pts`}
        </div>
      )}
    </div>
  );
}

function ScoreColumn({ name, totalStrokes, leads, breakdown }: {
  name: string;
  totalStrokes: number | null;
  leads: boolean;
  breakdown?: { playerId: string; name: string | null; score: string | null; strokes: number; missedCut: boolean }[];
}) {
  return (
    <div className="min-w-0">
      <div className="text-xs mb-1 truncate" style={{ color: "rgba(255,255,255,0.6)" }}>{name}</div>
      <div
        className="font-bold leading-none"
        style={{ fontSize: "clamp(26px, 5vw, 42px)", color: leads ? "#4ADE80" : "#fff" }}
      >
        {totalStrokes !== null ? (totalStrokes >= 0 ? `+${totalStrokes}` : totalStrokes) : "—"}
      </div>
      <div className="text-[10px] mt-1 mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>combined strokes</div>
      {breakdown && breakdown.length > 0 && (
        <div
          className="overflow-y-auto rounded p-2"
          style={{ maxHeight: 260, background: "rgba(0,0,0,0.2)" }}
        >
          {breakdown.map((b) => (
            <div key={b.playerId} className="flex justify-between py-1 px-1.5 text-xs gap-2">
              <span className="truncate flex-1 min-w-0" style={{ color: "#fff" }}>
                {b.name || b.playerId}
              </span>
              <span className="flex-shrink-0" style={{ color: b.missedCut ? "#F87171" : "rgba(255,255,255,0.7)" }}>
                {b.missedCut ? `MC +${b.strokes}` : b.score || "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
