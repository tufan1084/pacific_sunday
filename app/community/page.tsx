"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { subscribeFeed } from "@/app/lib/feedSocket";
import { IoPeopleOutline } from "react-icons/io5";
import CommunityHeader from "@/app/components/community/CommunityHeader";
import CommunityFilters from "@/app/components/community/CommunityFilters";
import CreatePostInline from "@/app/components/community/CreatePostInline";
import CreatePostModal from "@/app/components/community/CreatePostModal";
import PostCard from "@/app/components/community/PostCard";
import PostModalNew from "@/app/components/post-modal/PostModalNew";
import RecentActivityPanel from "@/app/components/community/RecentActivityPanel";
import CommunityStatus from "@/app/components/community/CommunityStatus";
import TeamPanel from "@/app/components/community/TeamPanel";
import TeamMembersSheet from "@/app/components/community/TeamMembersSheet";
import AddTeamPanel from "@/app/components/community/AddTeamPanel";
import MobileTeamSheet from "@/app/components/community/MobileTeamSheet";
import MobileTeamHub from "@/app/components/community/MobileTeamHub";
import GlobalSearchBar from "@/app/components/layout/GlobalSearchBar";
import { type TagOption } from "@/app/lib/community-data";
import { api } from "@/app/services/api";
import type { Team } from "@/app/types/community";
import { useToast } from "@/app/context/ToastContext";
import { Skeleton, shimmerCss } from "@/app/components/ui/Skeleton";

function PostsSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <style>{shimmerCss}</style>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{ background: "#13192A", borderRadius: 8, padding: 20 }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <Skeleton h={44} w={44} r={8} />
            <div style={{ flex: 1 }}>
              <Skeleton h={14} w="40%" mb={8} />
              <Skeleton h={12} w="25%" />
            </div>
          </div>
          <Skeleton h={14} w="90%" mb={6} />
          <Skeleton h={14} w={`${60 + i * 8}%`} />
        </div>
      ))}
    </div>
  );
}

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
  const savedCategoryParam = searchParams?.get("savedCategory");

  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [tagOptions, setTagOptions] = useState<TagOption[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>(initialTeam);
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  const [showAddTeam, setShowAddTeam] = useState(false);
  const addTeamRef = useRef<HTMLDivElement>(null);

  // When the AddTeam panel opens (e.g. via the mobile floating "+" button),
  // the feed often has scrolled past where the panel inlines, so users tap
  // and see no visible change. Scroll the panel into view as soon as it mounts.
  useEffect(() => {
    if (!showAddTeam) return;
    // Wait one frame for the panel to render before measuring/scrolling.
    const raf = requestAnimationFrame(() => {
      addTeamRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => cancelAnimationFrame(raf);
  }, [showAddTeam]);
  const [showMembersSheet, setShowMembersSheet] = useState(false);
  const [membersSheetView, setMembersSheetView] = useState<"members" | "settings" | "invite" | "requests">("members");
  const [membersRefreshToken, setMembersRefreshToken] = useState(0);

  const [hiddenPostIds, setHiddenPostIds] = useState<number[]>([]);
  const [hiddenUserIds, setHiddenUserIds] = useState<number[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("ps_hidden_users");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const [modalPost, setModalPost] = useState<any | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleOpenModal = (postId: number) => {
    const post = visiblePosts.find(p => p.id === postId);
    if (!post) return;
    
    // Only open modal if post has media (images/videos)
    const mediaUrls = Array.isArray(post.mediaUrls) ? post.mediaUrls : [];
    if (mediaUrls.length > 0) {
      setModalPost(post);
      // Update URL without page reload
      const params = new URLSearchParams(window.location.search);
      params.set('post', postId.toString());
      window.history.pushState({}, '', `${pathname}?${params.toString()}`);
    }
  };

  const handleCloseModal = () => {
    setModalPost(null);
    // Remove post parameter from URL
    const params = new URLSearchParams(window.location.search);
    params.delete('post');
    const qs = params.toString();
    window.history.pushState({}, '', qs ? `${pathname}?${qs}` : pathname);
  };

  // "Saved" tab loads via a different endpoint (/posts/saved) and replaces
  // the post list rather than filtering. Lazy-loaded the first time the tab opens.
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);
  const [savedLoadedOnce, setSavedLoadedOnce] = useState(false);

  const [isLg, setIsLg] = useState(true);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [mobileStats, setMobileStats] = useState<{ postsThisWeek: number | null; activeOwners: number | null; nfcScansToday: number | null } | null>(null);

  const [topVisible, setTopVisible] = useState(true);
  const lastScrollYRef = useRef(0);

  // Handle post modal from URL parameter
  useEffect(() => {
    const postIdParam = searchParams?.get('post');
    if (postIdParam && !loading) {
      const postId = parseInt(postIdParam);
      if (!isNaN(postId) && !modalPost) {
        const post = posts.find(p => p.id === postId);
        if (post) {
          const mediaUrls = Array.isArray(post.mediaUrls) ? post.mediaUrls : [];
          if (mediaUrls.length > 0) {
            setModalPost(post);
          }
        }
      }
    } else if (!postIdParam && modalPost) {
      setModalPost(null);
    }
  }, [searchParams, posts, loading, modalPost]);

  // Sync URL params with state
  useEffect(() => {
    const team = searchParams?.get("team") || ALL_OWNERS;
    const tab = searchParams?.get("tab") || "All Post";
    setActiveFilter(team);
    setActiveTab(tab);
  }, [searchParams]);

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

    let ticking = false;

    const onScroll = () => {
      if (ticking) return;
      
      ticking = true;
      requestAnimationFrame(() => {
        const y = scroller.scrollTop;
        const diff = y - lastScrollYRef.current;

        if (y <= 5) {
          setTopVisible(true);
        } else if (diff > 5) {
          setTopVisible(false);
        } else if (diff < -5) {
          setTopVisible(true);
        }
        lastScrollYRef.current = y;
        ticking = false;
      });
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

  useEffect(() => {
    if (!mobileSheetOpen || mobileStats) return;
    api.stats.community().then((res) => {
      if (res.success && res.data) {
        setMobileStats({
          postsThisWeek: res.data.postsThisWeek ?? null,
          activeOwners: res.data.activeOwners ?? null,
          nfcScansToday: res.data.nfcScansToday ?? null,
        });
      }
    }).catch(() => {});
  }, [mobileSheetOpen, mobileStats]);

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
    // Same per-post field update on both `posts` and `savedPosts` so the
    // Saved tab reflects live events the same way the main feed does.
    const updateBothLists = (postId: number, transform: (p: any) => any) => {
      setPosts(prev => prev.map(p => p.id === postId ? transform(p) : p));
      setSavedPosts(prev => prev.map(p => p.id === postId ? transform(p) : p));
    };

    const unsub: Array<() => void> = [];

    unsub.push(subscribeFeed("post:liked", ({ postId, likeCount, userId }: any) => {
      updateBothLists(postId, (p) => ({
        ...p,
        _count: { ...p._count, likes: likeCount },
        isLikedByUser: userId === currentUserId ? true : p.isLikedByUser,
      }));
    }));

    unsub.push(subscribeFeed("post:unliked", ({ postId, likeCount, userId }: any) => {
      updateBothLists(postId, (p) => ({
        ...p,
        _count: { ...p._count, likes: likeCount },
        isLikedByUser: userId === currentUserId ? false : p.isLikedByUser,
      }));
    }));

    unsub.push(subscribeFeed("post:created", (newPost: any) => {
      setPosts(prev => {
        const at = activeTeamRef.current;
        const ts = teamsRef.current;
        if (at && newPost.teamId !== at.id) return prev;
        if (!at && newPost.team?.privacy === "private" && !ts.find(t => t.id === newPost.teamId && t.isMember)) return prev;
        return [{ ...newPost, _computedTags: postTagSlugs(newPost) }, ...prev];
      });
    }));

    unsub.push(subscribeFeed("comment:added", ({ postId, commentCount }: any) => {
      updateBothLists(postId, (p) => ({ ...p, _count: { ...p._count, comments: commentCount } }));
    }));

    unsub.push(subscribeFeed("comment:deleted", ({ postId, commentCount }: any) => {
      updateBothLists(postId, (p) => ({ ...p, _count: { ...p._count, comments: commentCount } }));
    }));

    unsub.push(subscribeFeed("post:pinned", ({ postId, isPinned }: any) => {
      updateBothLists(postId, (p) => ({ ...p, isPinned }));
    }));

    unsub.push(subscribeFeed("post:edited", ({ postId, content, mediaUrls }: any) => {
      updateBothLists(postId, (p) => ({ ...p, content, mediaUrls: mediaUrls ?? p.mediaUrls }));
    }));

    unsub.push(subscribeFeed("post:deleted", ({ postId }: any) => {
      setPosts(prev => prev.filter(p => p.id !== postId));
      setSavedPosts(prev => prev.filter(p => p.id !== postId));
    }));

    unsub.push(subscribeFeed("post:shared", ({ postId, shareCount }: any) => {
      updateBothLists(postId, (p) => ({ ...p, shareCount }));
    }));

    unsub.push(subscribeFeed("team:created", (payload: any) => {
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
    }));

    unsub.push(subscribeFeed("team:memberChanged", ({ teamId, memberCount, userId, action }: any) => {
      const isSelf = userId === currentUserId;

      if (isSelf && action === "joined" && !teamsRef.current.some(t => t.id === teamId)) {
        fetchTeams();
        setMembersRefreshToken(n => n + 1);
        return;
      }

      setTeams(prev => prev.map(t => {
        if (t.id !== teamId) return t;
        if (isSelf && action === "removed") return null;
        return {
          ...t,
          memberCount,
          isMember: isSelf ? action === "joined" : t.isMember,
          role: isSelf && action === "left" ? null : t.role,
        };
      }).filter(Boolean) as typeof prev);
      setMembersRefreshToken(n => n + 1);
    }));

    unsub.push(subscribeFeed("team:updated", ({ teamId, team }: any) => {
      setTeams(prev => prev.map(t => t.id === teamId ? { ...t, ...team } : t));
    }));

    unsub.push(subscribeFeed("team:joinRequest", ({ teamId }: any) => {
      if (activeTeamRef.current?.id === teamId) setMembersRefreshToken(n => n + 1);
    }));

    unsub.push(subscribeFeed("team:invite", ({ userId, action }: any) => {
      if (userId === currentUserId && action === "accepted") fetchTeams();
    }));

    unsub.push(subscribeFeed("team:deleted", ({ teamId }: any) => {
      setTeams(prev => prev.filter(t => t.id !== teamId));
      if (activeTeamRef.current?.id === teamId) setActiveFilter(ALL_OWNERS);
    }));

    return () => { unsub.forEach(fn => fn()); };
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
    } else if (activeTab === "Shared") {
      // Show only reshared posts by current user
      list = list.filter(p => p.originalPostId && p.originalPost && (p.user?.id === currentUserId || p.userId === currentUserId));
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
  // Also handle savedCategory query param for filtering by category.
  useEffect(() => {
    if (activeTab !== "Saved") return;
    let cancelled = false;
    setSavedLoading(true);
    
    const categoryId = savedCategoryParam === "uncategorized" 
      ? "uncategorized" 
      : savedCategoryParam 
      ? parseInt(savedCategoryParam) 
      : undefined;
    
    console.log('[Saved Posts] Fetching with categoryId:', categoryId);
    
    api.posts.listSaved(categoryId)
      .then((res) => {
        if (cancelled) return;
        console.log('[Saved Posts] API Response:', res);
        if (res.success && res.data) {
          const posts = res.data.savedPosts.map((s) => s.post);
          console.log('[Saved Posts] Extracted posts:', posts.length, posts);
          setSavedPosts(posts);
        } else {
          console.log('[Saved Posts] API failed or no data');
        }
        setSavedLoadedOnce(true);
      })
      .catch((err) => {
        console.error('[Saved Posts] Error:', err);
      })
      .finally(() => { if (!cancelled) setSavedLoading(false); });
    return () => { cancelled = true; };
  }, [activeTab, savedCategoryParam]);





  const handleHidePost = (postId: number) => {
    setHiddenPostIds(prev => [...prev, postId]);
  };
  const handleHideUser = (userId: number) => {
    setHiddenUserIds(prev => {
      const updated = [...prev, userId];
      if (typeof window !== "undefined") {
        localStorage.setItem("ps_hidden_users", JSON.stringify(updated));
      }
      return updated;
    });
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
    paddingBottom: "8px",
    ...(isLg
      ? {}
      : {
          // Mobile <main> uses 12px padding (see .main-content in globals.css).
          // Match it so the sticky header extends edge-to-edge without
          // overshooting and triggering horizontal page scroll.
          marginLeft: "-12px",
          marginRight: "-12px",
          paddingLeft: "12px",
          paddingRight: "12px",
        }),
    transform: !isLg && !topVisible ? "translateY(-110%)" : "translateY(0)",
    opacity: !isLg && !topVisible ? 0 : 1,
    pointerEvents: !isLg && !topVisible ? "none" : "auto",
    transition: isLg ? "none" : "all 0.2s ease-out",
  };

  // Optimized sticky style for right sidebar
  const rightStickyStyle: React.CSSProperties = {
    minWidth: 0,
    alignSelf: "start",
    position: "sticky",
    top: "0px",
    zIndex: 10,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxHeight: "100vh",
    overflowY: "auto",
    paddingTop: "20px",
  };

  return (
    <>
      <div className="lg:grid lg:grid-cols-[3fr_2fr] lg:gap-5">
        {/* LEFT COLUMN */}
        <div style={{ minWidth: 0 }}>
          <div style={leftStickyStyle}>
            <CommunityHeader />
            <CommunityFilters
              teams={teams}
              tabs={["All Post", "Pinned", "Saved", "Shared", ...tagOptions.map(t => t.label)]}
              activeFilter={activeFilter}
              activeTab={activeTab}
              onFilterChange={(f) => { setActiveFilter(f); setShowMembersSheet(false); }}
              onTabChange={setActiveTab}
              onAddTeam={() => setShowAddTeam(true)}
            />
          </div>
          
          <CreatePostInline onOpenModal={() => setShowCreateModal(true)} />

          {showAddTeam && (
            <div ref={addTeamRef} style={{ scrollMarginTop: "16px" }}>
              <AddTeamPanel
                onClose={() => setShowAddTeam(false)}
                onCreated={handleTeamCreated}
              />
            </div>
          )}

          {loading || (activeTab === "Saved" && savedLoading && !savedLoadedOnce) ? (
            <PostsSkeleton />
          ) : visiblePosts.length === 0 ? (
            <div
              style={{
                backgroundColor: "#13192A",
                borderRadius: "8px",
                padding: "32px 20px",
                color: "#94A3B8",
                textAlign: "center",
                fontFamily: "var(--font-poppins), sans-serif",
                marginBottom: "12px",
              }}
            >
              <div style={{ fontSize: "15px", marginBottom: "6px" }}>
                {activeTab === "Saved" && savedCategoryParam
                  ? "No posts in this category."
                  : activeTab === "Saved"
                  ? "You haven't saved any posts yet."
                  : activeTab === "Pinned"
                  ? "No pinned posts yet."
                  : activeTab === "Shared"
                  ? "No shared posts yet."
                  : activeTab !== "All Post"
                  ? `No posts in ${activeTab} yet.`
                  : activeTeam
                  ? `No posts in ${activeTeam.name} yet.`
                  : "No posts yet."}
              </div>
              <div style={{ fontSize: "13px", color: "#888" }}>
                {activeTab === "Saved" && savedCategoryParam
                  ? "Save posts to this category to see them here."
                  : activeTab === "Saved"
                  ? "Tap the menu on any post and choose Save post."
                  : activeTab === "Shared"
                  ? "Reshare posts to see them here."
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
                onOpenModal={handleOpenModal}
              />
            ))
          )}
        </div>

        {/* RIGHT COLUMN: Desktop only */}
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
              bottom: "calc(20px + env(safe-area-inset-bottom))",
              width: "52px",
              height: "52px",
              borderRadius: "999px",
              backgroundColor: "#E8C96A",
              color: "#060D1F",
              border: "none",
              cursor: "pointer",
              zIndex: 40,
              boxShadow: "0 6px 18px rgba(0,0,0,0.35)",
              WebkitTransform: "translateZ(0)",
              transform: "translateZ(0)",
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
              <MobileTeamHub
                teams={teams}
                stats={mobileStats}
                activeTeam={activeTeam}
                onCreateTeam={() => { setMobileSheetOpen(false); setShowAddTeam(true); }}
                onSelectTeam={(team) => { setActiveFilter(team.name); setMobileSheetOpen(false); }}
                onViewTeam={(team, view) => {
                  setActiveFilter(team.name);
                  setMembersSheetView(view || "members");
                  setShowMembersSheet(true);
                }}
              />
            )}
          </MobileTeamSheet>
        </>
      )}

      {/* Modals */}
      {modalPost && (
        <PostModalNew
          post={modalPost}
          isOpen={true}
          onClose={handleCloseModal}
        />
      )}
      
      <CreatePostModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPostCreated={() => fetchPosts(activeTeam?.id)}
        activeTeam={activeTeam}
        userTeams={teams.filter(t => t.isMember)}
        tagOptions={tagOptions}
        onTeamChange={(name) => setActiveFilter(name)}
      />
    </>
  );
}
