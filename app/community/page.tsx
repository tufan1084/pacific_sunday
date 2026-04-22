"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import CommunityHeader from "@/app/components/community/CommunityHeader";
import CommunityFilters from "@/app/components/community/CommunityFilters";
import CreatePostInline from "@/app/components/community/CreatePostInline";
import PostCard from "@/app/components/community/PostCard";
import RecentActivityPanel from "@/app/components/community/RecentActivityPanel";
import CommunityStatus from "@/app/components/community/CommunityStatus";
import TeamPanel from "@/app/components/community/TeamPanel";
import TeamMembersSheet from "@/app/components/community/TeamMembersSheet";
import AddTeamPanel from "@/app/components/community/AddTeamPanel";
import { COMMUNITY_STATS, TAG_KEYWORDS } from "@/app/lib/community-data";
import { api } from "@/app/services/api";
import { SOCKET_URL } from "@/app/lib/constants";
import type { Team } from "@/app/types/community";
import { useToast } from "@/app/context/ToastContext";

const ALL_OWNERS = "All Owners";

function detectPostTags(post: any): string[] {
  const content = (post.content || "").toLowerCase();
  const auto: string[] = [];
  for (const [tag, kws] of Object.entries(TAG_KEYWORDS)) {
    if (kws.some(k => content.includes(k))) auto.push(tag);
  }
  const manual: string[] = Array.isArray(post.tags) ? post.tags : [];
  return Array.from(new Set([...auto, ...manual]));
}

export default function CommunityPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>(ALL_OWNERS);
  const [activeTab, setActiveTab] = useState<string>("All Post");

  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showMembersSheet, setShowMembersSheet] = useState(false);
  const [membersSheetView, setMembersSheetView] = useState<"members" | "settings" | "invite" | "requests">("members");
  const [membersRefreshToken, setMembersRefreshToken] = useState(0);

  const [hiddenPostIds, setHiddenPostIds] = useState<number[]>([]);
  const [hiddenUserIds, setHiddenUserIds] = useState<number[]>([]);

  const toast = useToast();

  const currentUserId = typeof window !== "undefined"
    ? parseInt(localStorage.getItem("ps_user_id") || "0") : 0;

  const activeTeam = useMemo(
    () => teams.find(t => t.name === activeFilter) || null,
    [teams, activeFilter]
  );

  // Refs mirror live state for socket handlers so the socket never re-subscribes
  // on team/tab changes — which would drop events (e.g. pin) during reconnect.
  const activeTeamRef = useRef(activeTeam);
  const teamsRef = useRef(teams);
  useEffect(() => { activeTeamRef.current = activeTeam; }, [activeTeam]);
  useEffect(() => { teamsRef.current = teams; }, [teams]);

  const fetchTeams = useCallback(async () => {
    try {
      const res = await api.teams.list();
      if (res.success) {
        setTeams((res.data as any)?.teams ?? []);
      }
    } catch (e) {
      console.error("Failed to fetch teams:", e);
    }
  }, []);

  const fetchPosts = useCallback(async (teamId?: number) => {
    try {
      const res = await api.posts.getAll(20, 0, teamId);
      if (res.success) {
        const data = res.data as any;
        const withTags = (data?.posts ?? []).map((p: any) => ({
          ...p,
          _computedTags: detectPostTags(p),
        }));
        setPosts(withTags);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch posts when active team changes
  useEffect(() => {
    setLoading(true);
    fetchPosts(activeTeam?.id);
  }, [activeTeam?.id, fetchPosts]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    const socket: Socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socket.on("post:liked", ({ postId, likeCount, userId }) => {
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        _count: { ...p._count, likes: likeCount },
        isLikedByUser: userId === currentUserId ? true : p.isLikedByUser,
      } : p));
    });

    socket.on("post:unliked", ({ postId, likeCount, userId }) => {
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        _count: { ...p._count, likes: likeCount },
        isLikedByUser: userId === currentUserId ? false : p.isLikedByUser,
      } : p));
    });

    socket.on("post:created", (newPost) => {
      setPosts(prev => {
        const at = activeTeamRef.current;
        const ts = teamsRef.current;
        // Only show if it belongs in the current view: global feed OR matching team
        if (at && newPost.teamId !== at.id) return prev;
        if (!at && newPost.team?.privacy === "private" && !ts.find(t => t.id === newPost.teamId && t.isMember)) return prev;
        return [{ ...newPost, _computedTags: detectPostTags(newPost) }, ...prev];
      });
    });

    socket.on("comment:added", ({ postId, commentCount }) => {
      setPosts(prev => prev.map(p => p.id === postId ? {
        ...p,
        _count: { ...p._count, comments: commentCount },
      } : p));
    });

    socket.on("post:pinned", ({ postId, isPinned }) => {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isPinned } : p));
    });

    socket.on("post:deleted", ({ postId }) => {
      setPosts(prev => prev.filter(p => p.id !== postId));
    });

    socket.on("post:shared", ({ postId, shareCount }) => {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, shareCount } : p));
    });

    socket.on("team:created", (payload: any) => {
      const memberIds: number[] = Array.isArray(payload?.memberIds) ? payload.memberIds : [];
      const isMember = currentUserId > 0 && memberIds.includes(currentUserId);

      // Private teams are only visible to their members — skip for everyone else.
      if (payload.privacy === "private" && !isMember) return;

      const team: Team = {
        id: payload.id,
        name: payload.name,
        description: payload.description ?? null,
        privacy: payload.privacy,
        creatorId: payload.creatorId,
        memberCount: payload.memberCount ?? memberIds.length,
        isMember,
        role: isMember ? (payload.creatorId === currentUserId ? "admin" : "member") : null,
        createdAt: payload.createdAt,
      };
      setTeams(prev => prev.some(t => t.id === team.id) ? prev : [...prev, team]);
    });

    socket.on("team:memberChanged", ({ teamId, memberCount, userId, action }) => {
      setTeams(prev => prev.map(t => {
        if (t.id !== teamId) return t;
        const isSelf = userId === currentUserId;
        
        // If current user was removed, remove team from list
        if (isSelf && action === "removed") {
          return null; // Will be filtered out
        }
        
        return {
          ...t,
          memberCount,
          isMember: isSelf ? action === "joined" : t.isMember,
          role: isSelf && action === "left" ? null : t.role,
        };
      }).filter(Boolean) as typeof prev);
      setMembersRefreshToken(n => n + 1);
    });

    socket.on("team:updated", ({ teamId, team }) => {
      setTeams(prev => prev.map(t => t.id === teamId ? { ...t, ...team } : t));
    });

    socket.on("team:joinRequest", ({ teamId, userId, action }) => {
      // Refresh members if you're viewing this team
      if (activeTeamRef.current?.id === teamId) {
        setMembersRefreshToken(n => n + 1);
      }
    });

    socket.on("team:invite", ({ teamId, userId, action }) => {
      // If current user accepted an invite, refresh teams list
      if (userId === currentUserId && action === "accepted") {
        fetchTeams();
      }
    });

    socket.on("team:deleted", ({ teamId }) => {
      // Remove deleted team from list
      setTeams(prev => prev.filter(t => t.id !== teamId));
      // If viewing deleted team, switch to All Owners
      if (activeTeamRef.current?.id === teamId) {
        setActiveFilter(ALL_OWNERS);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUserId, fetchTeams]);

  const visiblePosts = useMemo(() => {
    let list = posts.filter(p => !hiddenPostIds.includes(p.id));
    list = list.filter(p => !hiddenUserIds.includes(p.user?.id ?? p.userId ?? -1));

    if (activeTab === "Pinned") {
      list = list.filter(p => p.isPinned);
    } else if (activeTab === "Fantasy Talk") {
      list = list.filter(p => (p._computedTags || []).includes("fantasy_talk"));
    } else if (activeTab === "Bag Flex") {
      list = list.filter(p => (p._computedTags || []).includes("bag_flex"));
    }

    // Mirror backend sort: pinned first, then newest first — keeps UI in sync
    // when socket events toggle isPinned without a refetch.
    return [...list].sort((a, b) => {
      const pinDiff = Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned));
      if (pinDiff !== 0) return pinDiff;
      const at = new Date(a.createdAt).getTime();
      const bt = new Date(b.createdAt).getTime();
      return bt - at;
    });
  }, [posts, activeTab, hiddenPostIds, hiddenUserIds]);

  const handleHidePost = (postId: number) => {
    setHiddenPostIds(prev => [...prev, postId]);
  };
  const handleHideUser = (userId: number) => {
    setHiddenUserIds(prev => [...prev, userId]);
  };

  const handleTeamCreated = (team: Team) => {
    setTeams(prev => prev.some(t => t.id === team.id) ? prev : [...prev, team]);
    setActiveFilter(team.name);
    setShowAddTeam(false);
  };

  const handleJoin = async (teamId: number) => {
    const res = await api.teams.join(teamId);
    if (res.success) {
      const { memberCount } = (res.data as any) || {};
      setTeams(prev => prev.map(t => t.id === teamId ? {
        ...t, isMember: true, role: t.role ?? "member", memberCount: memberCount ?? t.memberCount,
      } : t));
      setMembersRefreshToken(n => n + 1);
    }
  };

  const handleLeave = async (teamId: number) => {
    const res = await api.teams.leave(teamId);
    if (res.success) {
      const { memberCount } = (res.data as any) || {};
      setTeams(prev => prev.map(t => t.id === teamId ? {
        ...t, isMember: false, role: null, memberCount: memberCount ?? t.memberCount,
      } : t));
      setMembersRefreshToken(n => n + 1);
    }
  };

  return (
    <>
      <CommunityHeader />

      <CommunityFilters
        teams={teams}
        activeFilter={activeFilter}
        activeTab={activeTab}
        onFilterChange={(f) => { setActiveFilter(f); setShowMembersSheet(false); }}
        onTabChange={setActiveTab}
        onAddTeam={() => setShowAddTeam(true)}
      />

      {showAddTeam && (
        <AddTeamPanel
          onClose={() => setShowAddTeam(false)}
          onCreated={handleTeamCreated}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 items-start">
        <div>
          <CreatePostInline
            onPostCreated={() => fetchPosts(activeTeam?.id)}
            activeTeam={activeTeam}
            userTeams={teams.filter(t => t.isMember)}
            onTeamChange={(name) => setActiveFilter(name)}
          />

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#94A3B8" }}>
              Loading posts...
            </div>
          ) : visiblePosts.length === 0 ? (
            <div
              style={{
                backgroundColor: "#13192A",
                borderRadius: "5px",
                padding: "40px 20px",
                color: "#94A3B8",
                textAlign: "center",
                fontFamily: "var(--font-poppins), sans-serif",
              }}
            >
              <div style={{ fontSize: "15px", marginBottom: "6px" }}>
                {activeTab === "Pinned"
                  ? "No pinned posts yet."
                  : activeTab === "Fantasy Talk"
                  ? "No fantasy talk posts yet."
                  : activeTab === "Bag Flex"
                  ? "No bag flex posts yet."
                  : activeTeam
                  ? `No posts in ${activeTeam.name} yet.`
                  : "No posts yet."}
              </div>
              <div style={{ fontSize: "13px", color: "#888" }}>
                Be the first to post!
              </div>
            </div>
          ) : (
            visiblePosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onUpdate={() => fetchPosts(activeTeam?.id)}
                onHidePost={handleHidePost}
                onHideUser={handleHideUser}
              />
            ))
          )}
        </div>

        <div className="flex flex-col gap-4">
          {showMembersSheet && activeTeam ? (
            <TeamMembersSheet
              team={activeTeam}
              onClose={() => { setShowMembersSheet(false); setMembersSheetView("members"); }}
              onJoin={handleJoin}
              onLeave={handleLeave}
              refreshToken={membersRefreshToken}
              initialView={membersSheetView}
            />
          ) : (
            <TeamPanel
              activeTeam={activeTeam}
              onViewAll={(view) => { setMembersSheetView(view || "members"); setShowMembersSheet(true); }}
              onJoin={handleJoin}
              onLeave={handleLeave}
              refreshToken={membersRefreshToken}
            />
          )}
          <CommunityStatus stats={COMMUNITY_STATS} />
        </div>
      </div>
    </>
  );
}
