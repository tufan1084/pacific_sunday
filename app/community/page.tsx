"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { IoPeopleOutline } from "react-icons/io5";
import CommunityHeader from "@/app/components/community/CommunityHeader";
import CommunityFilters from "@/app/components/community/CommunityFilters";
import CreatePostInline from "@/app/components/community/CreatePostInline";
import PostCard from "@/app/components/community/PostCard";
import RecentActivityPanel from "@/app/components/community/RecentActivityPanel";
import CommunityStatus from "@/app/components/community/CommunityStatus";
import TeamPanel from "@/app/components/community/TeamPanel";
import TeamMembersSheet from "@/app/components/community/TeamMembersSheet";
import AddTeamPanel from "@/app/components/community/AddTeamPanel";
import MobileTeamSheet from "@/app/components/community/MobileTeamSheet";
import GlobalSearchBar from "@/app/components/layout/GlobalSearchBar";
import { type TagOption } from "@/app/lib/community-data";
import { api } from "@/app/services/api";
import { SOCKET_URL } from "@/app/lib/constants";
import type { Team } from "@/app/types/community";
import { useToast } from "@/app/context/ToastContext";

const ALL_OWNERS = "All Owners";

// The backend now returns `tagSlugs: string[]` on each post (derived from
// PostTag rows). Tabs "All Post" and "Pinned" are special — the rest are
// driven by the Tag table (admin-managed in /management-portal/tags).
function postTagSlugs(post: any): string[] {
  if (Array.isArray(post?.tagSlugs)) return post.tagSlugs;
  if (Array.isArray(post?.tags)) {
    return post.tags
      .map((t: any) => (typeof t === "string" ? t : t?.tag?.slug ?? t?.slug))
      .filter(Boolean);
  }
  return [];
}

export default function CommunityPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initialTeam = searchParams?.get("team") || ALL_OWNERS;
  const initialTab = searchParams?.get("tab") || "All Post";

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tagOptions, setTagOptions] = useState<TagOption[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>(initialTeam);
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const [showAddTeam, setShowAddTeam] = useState(false);
  const [showMembersSheet, setShowMembersSheet] = useState(false);
  const [membersSheetView, setMembersSheetView] = useState<"members" | "settings" | "invite" | "requests">("members");
  const [membersRefreshToken, setMembersRefreshToken] = useState(0);

  const [hiddenPostIds, setHiddenPostIds] = useState<number[]>([]);
  const [hiddenUserIds, setHiddenUserIds] = useState<number[]>([]);

  // "Saved" tab loads via a different endpoint (/posts/saved) and replaces
  // the post list rather than filtering. Lazy-loaded the first time the tab opens.
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedLoadedOnce, setSavedLoadedOnce] = useState(false);

  const [isLg, setIsLg] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const [topVisible, setTopVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsLg(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsLg(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    const scroller = document.querySelector<HTMLElement>("main");
    if (!scroller) return;

    const onScroll = () => {
      const y = scroller.scrollTop;
      const diff = y - lastScrollYRef.current;

      if (y <= 8) {
        setTopVisible(true);
      } else if (diff > 6) {
        setTopVisible(false);
      } else if (diff < -6) {
        setTopVisible(true);
      }
      lastScrollYRef.current = y;
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => scroller.removeEventListener("scroll", onScroll);
  }, []);

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
          _computedTags: postTagSlugs(p),
        }));
        setPosts(withTags);
      }
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const res = await api.tags.list();
      if (res.success) setTagOptions((res.data as any)?.tags ?? []);
    } catch (e) {
      console.error("Failed to fetch tags:", e);
    }
  }, []);

  useEffect(() => { fetchTags(); }, [fetchTags]);

  // Mirror active team/tab into the URL so refresh preserves the selection.
  // Defaults (All Owners / All Post) are omitted to keep the URL clean.
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeFilter && activeFilter !== ALL_OWNERS) params.set("team", activeFilter);
    if (activeTab && activeTab !== "All Post") params.set("tab", activeTab);
    const qs = params.toString();
    const next = qs ? `${pathname}?${qs}` : pathname;
    const current = `${pathname}${typeof window !== "undefined" ? window.location.search : ""}`;
    if (next !== current) router.replace(next);
  }, [activeFilter, activeTab, pathname, router]);

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

    // Helper: same per-post field update on both `posts` and `savedPosts` so the
    // Saved tab reflects live events the same way the main feed does.
    const updateBothLists = (postId: number, transform: (p: any) => any) => {
      setPosts(prev => prev.map(p => p.id === postId ? transform(p) : p));
      setSavedPosts(prev => prev.map(p => p.id === postId ? transform(p) : p));
    };

    socket.on("post:liked", ({ postId, likeCount, userId }) => {
      updateBothLists(postId, (p) => ({
        ...p,
        _count: { ...p._count, likes: likeCount },
        isLikedByUser: userId === currentUserId ? true : p.isLikedByUser,
      }));
    });

    socket.on("post:unliked", ({ postId, likeCount, userId }) => {
      updateBothLists(postId, (p) => ({
        ...p,
        _count: { ...p._count, likes: likeCount },
        isLikedByUser: userId === currentUserId ? false : p.isLikedByUser,
      }));
    });

    socket.on("post:created", (newPost) => {
      setPosts(prev => {
        const at = activeTeamRef.current;
        const ts = teamsRef.current;
        // Only show if it belongs in the current view: global feed OR matching team
        if (at && newPost.teamId !== at.id) return prev;
        if (!at && newPost.team?.privacy === "private" && !ts.find(t => t.id === newPost.teamId && t.isMember)) return prev;
        return [{ ...newPost, _computedTags: postTagSlugs(newPost) }, ...prev];
      });
    });

    socket.on("comment:added", ({ postId, commentCount }) => {
      updateBothLists(postId, (p) => ({
        ...p,
        _count: { ...p._count, comments: commentCount },
      }));
    });

    socket.on("comment:deleted", ({ postId, commentCount }) => {
      updateBothLists(postId, (p) => ({
        ...p,
        _count: { ...p._count, comments: commentCount },
      }));
    });

    socket.on("post:pinned", ({ postId, isPinned }) => {
      updateBothLists(postId, (p) => ({ ...p, isPinned }));
    });

    socket.on("post:deleted", ({ postId }) => {
      setPosts(prev => prev.filter(p => p.id !== postId));
      setSavedPosts(prev => prev.filter(p => p.id !== postId));
    });

    socket.on("post:shared", ({ postId, shareCount }) => {
      updateBothLists(postId, (p) => ({ ...p, shareCount }));
    });

    socket.on("team:created", (payload: any) => {
      const memberIds: number[] = Array.isArray(payload?.memberIds) ? payload.memberIds : [];
      const isMember = currentUserId > 0 && memberIds.includes(currentUserId);

      // Dropdown is "my teams" only — skip unless the current user is in the member list.
      if (!isMember) return;

      const team: Team = {
        id: payload.id,
        name: payload.name,
        description: payload.description ?? null,
        imageUrl: payload.imageUrl ?? null,
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
      const isSelf = userId === currentUserId;

      // If I just joined a team that isn't in my dropdown yet (e.g. a public
      // team I joined via search), refetch so it appears.
      if (isSelf && action === "joined" && !teamsRef.current.some(t => t.id === teamId)) {
        fetchTeams();
        setMembersRefreshToken(n => n + 1);
        return;
      }

      setTeams(prev => prev.map(t => {
        if (t.id !== teamId) return t;

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
    // "Saved" tab uses a separate dataset fetched from /posts/saved.
    if (activeTab === "Saved") {
      return savedPosts
        .filter((p) => !hiddenPostIds.includes(p.id))
        .filter((p) => !hiddenUserIds.includes(p.user?.id ?? p.userId ?? -1));
    }

    let list = posts.filter(p => !hiddenPostIds.includes(p.id));
    list = list.filter(p => !hiddenUserIds.includes(p.user?.id ?? p.userId ?? -1));

    if (activeTab === "Pinned") {
      list = list.filter(p => p.isPinned);
    } else if (activeTab !== "All Post") {
      // Anything else is a tag label coming from the server — match by slug.
      const tag = tagOptions.find(t => t.label === activeTab);
      if (tag) {
        list = list.filter(p => (p._computedTags || []).includes(tag.slug));
      }
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
  }, [posts, savedPosts, activeTab, hiddenPostIds, hiddenUserIds, tagOptions]);

  // Lazy-load saved posts the first time the user opens the Saved tab; refresh
  // whenever they switch back to it (so unsaving a post elsewhere is reflected).
  useEffect(() => {
    if (activeTab !== "Saved") return;
    let cancelled = false;
    setSavedLoading(true);
    api.posts.listSaved()
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.data) {
          setSavedPosts(res.data.savedPosts.map((s) => s.post));
        }
        setSavedLoadedOnce(true);
      })
      .finally(() => { if (!cancelled) setSavedLoading(false); });
    return () => { cancelled = true; };
  }, [activeTab]);

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

  const leftStickyStyle: React.CSSProperties = {
    position: "sticky",
    top: "-20px",
    zIndex: 20,
    backgroundColor: "#060D1F",
    marginTop: "-20px",
    paddingTop: "20px",
    // On mobile, full-bleed into main's 20px side padding so the sticky bg covers edge-to-edge
    ...(isLg
      ? {}
      : {
          marginLeft: "-20px",
          marginRight: "-20px",
          paddingLeft: "20px",
          paddingRight: "20px",
        }),
    transform: !isLg && !topVisible ? "translateY(-105%)" : "translateY(0)",
    transition: isLg ? "none" : "transform 0.28s ease",
    willChange: isLg ? "auto" : "transform",
  };

  // Apply sticky directly to the grid cell (not an inner wrapper) with
  // align-self:start so the cell shrinks to its own content instead of
  // stretching to the feed's height. Otherwise, when the feed is short the
  // cell has no sticking range and the whole sidebar scrolls away.
  // maxHeight + overflowY keep the panel inside the viewport when its
  // combined content is taller than the screen.
  const rightStickyStyle: React.CSSProperties = {
    minWidth: 0,
    alignSelf: "start",
    position: "sticky",
    top: "-20px",
    zIndex: 20,
    backgroundColor: "#060D1F",
    marginTop: "-20px",
    paddingTop: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    maxHeight: "calc(100vh + 20px)",
    overflowY: "auto",
  };

  return (
    <>
      <div className="lg:grid lg:grid-cols-[3fr_2fr] lg:gap-4">
        {/* LEFT COLUMN: header + filters + create post (sticky), then add-team panel and posts */}
        <div style={{ minWidth: 0 }}>
          <div style={leftStickyStyle}>
            <CommunityHeader />
            <CommunityFilters
              teams={teams}
              tabs={["All Post", "Pinned", "Saved", ...tagOptions.map(t => t.label)]}
              activeFilter={activeFilter}
              activeTab={activeTab}
              onFilterChange={(f) => { setActiveFilter(f); setShowMembersSheet(false); }}
              onTabChange={setActiveTab}
              onAddTeam={() => setShowAddTeam(true)}
            />
            <CreatePostInline
              onPostCreated={() => fetchPosts(activeTeam?.id)}
              activeTeam={activeTeam}
              userTeams={teams.filter(t => t.isMember)}
              tagOptions={tagOptions}
              onTeamChange={(name) => setActiveFilter(name)}
            />
          </div>

          {showAddTeam && (
            <AddTeamPanel
              onClose={() => setShowAddTeam(false)}
              onCreated={handleTeamCreated}
            />
          )}

          {loading || (activeTab === "Saved" && savedLoading && !savedLoadedOnce) ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#94A3B8" }}>
              {activeTab === "Saved" ? "Loading saved posts..." : "Loading posts..."}
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
                {activeTab === "Saved"
                  ? "You haven't saved any posts yet."
                  : activeTab === "Pinned"
                  ? "No pinned posts yet."
                  : activeTab !== "All Post"
                  ? `No posts in ${activeTab} yet.`
                  : activeTeam
                  ? `No posts in ${activeTeam.name} yet.`
                  : "No posts yet."}
              </div>
              <div style={{ fontSize: "13px", color: "#888" }}>
                {activeTab === "Saved"
                  ? "Tap the menu on any post and choose Save post."
                  : "Be the first to post!"}
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

        {/* RIGHT COLUMN: search + sidebar + status (all sticky). Desktop only. */}
        {isLg && (
          <div style={rightStickyStyle}>
            <GlobalSearchBar />
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
            <CommunityStatus />
          </div>
        )}
      </div>

      {!isLg && (
        <>
          <button
            onClick={() => setMobileSheetOpen(true)}
            aria-label="Team info and community stats"
            className="lg:hidden flex items-center justify-center"
            style={{
              position: "fixed",
              right: "16px",
              bottom: "20px",
              width: "52px",
              height: "52px",
              borderRadius: "999px",
              backgroundColor: "#E8C96A",
              color: "#060D1F",
              border: "none",
              cursor: "pointer",
              zIndex: 40,
              boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
            }}
          >
            <IoPeopleOutline size={22} />
          </button>

          <MobileTeamSheet open={mobileSheetOpen} onClose={() => setMobileSheetOpen(false)}>
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
            <CommunityStatus />
          </MobileTeamSheet>
        </>
      )}
    </>
  );
}
