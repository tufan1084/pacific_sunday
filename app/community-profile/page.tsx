"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { FiArrowLeft, FiLock, FiUnlock, FiCheck, FiX, FiUsers, FiUserPlus, FiTrash2, FiEdit2 } from "react-icons/fi";
import { AiFillHeart } from "react-icons/ai";
import { BsChatDots } from "react-icons/bs";
import { api, ApiFollowRequest } from "@/app/services/api";
import { useToast } from "@/app/context/ToastContext";
import { useConfirm } from "@/app/context/ConfirmContext";
import { useAuth } from "@/app/context/AuthContext";
import { resolveMediaUrl } from "@/app/lib/constants";
import GolfLoader from "@/app/components/ui/GolfLoader";

type TabType = "posts" | "followers" | "following" | "requests" | "blocked";

interface Post {
  id: number;
  content: string;
  mediaUrls: any;
  createdAt: string;
  _count: { likes: number; comments: number };
  shareCount?: number;
  reshareComment?: string | null;
  originalPost?: {
    id: number;
    content: string;
    mediaUrls: any;
    user: {
      id: number;
      username: string;
      profile: { name: string } | null;
    };
  } | null;
}

interface FollowUser {
  id: number;
  username: string;
  name: string;
  photoUrl?: string | null;
}

export default function CommunityProfilePage() {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const { user, refreshUser } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  // Stats
  const [postCount, setPostCount] = useState(0);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [userBio, setUserBio] = useState<string | null>(null);

  // Data
  const [posts, setPosts] = useState<Post[]>([]);
  const [followers, setFollowers] = useState<FollowUser[]>([]);
  const [following, setFollowing] = useState<FollowUser[]>([]);
  const [followRequests, setFollowRequests] = useState<ApiFollowRequest[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<FollowUser[]>([]);
  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [postToDelete, setPostToDelete] = useState<number | null>(null);
  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [editMedia, setEditMedia] = useState<File[]>([]);
  const [editMediaPreviews, setEditMediaPreviews] = useState<string[]>([]);
  const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>([]);

  const [loadingData, setLoadingData] = useState(false);
  const [processing, setProcessing] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (!loading) {
      loadTabData();
    }
  }, [activeTab, loading]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      if (!user?.id) return;

      const [profileRes, userProfileRes] = await Promise.all([
        api.profile.get(),
        api.follows.getUserProfile(user.id),
      ]);

      if (profileRes.success && profileRes.data) {
        setIsPrivate((profileRes.data as any).user?.isPrivate || false);
      }

      if (userProfileRes.success && userProfileRes.data) {
        const userData = userProfileRes.data.user;
        setPostCount(userData.postCount);
        setFollowerCount(userData.followerCount);
        setFollowingCount(userData.followingCount);
        setUserBio(userData.bio || null);
        console.log("User profile data:", userData);
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async () => {
    if (!user?.id) return;
    setLoadingData(true);
    try {
      if (activeTab === "posts") {
        const res = await api.posts.getAll(50, 0);
        if (res.success && res.data) {
          const userPosts = (res.data as any).posts.filter((p: any) => p.user.id === user.id);
          setPosts(userPosts);
        }
      } else if (activeTab === "followers") {
        const res = await api.follows.getFollowers(user.id);
        if (res.success && res.data) {
          // Fetch full user profiles with photos
          const followersWithPhotos = await Promise.all(
            res.data.users.map(async (u) => {
              const profileRes = await api.follows.getUserProfile(u.id);
              return {
                ...u,
                photoUrl: profileRes.success ? profileRes.data?.user.photoUrl : null,
              };
            })
          );
          setFollowers(followersWithPhotos);
        }
      } else if (activeTab === "following") {
        const res = await api.follows.getFollowing(user.id);
        if (res.success && res.data) {
          // Fetch full user profiles with photos
          const followingWithPhotos = await Promise.all(
            res.data.users.map(async (u) => {
              const profileRes = await api.follows.getUserProfile(u.id);
              return {
                ...u,
                photoUrl: profileRes.success ? profileRes.data?.user.photoUrl : null,
              };
            })
          );
          setFollowing(followingWithPhotos);
        }
      } else if (activeTab === "requests") {
        const res = await api.follows.getFollowRequests();
        if (res.success && res.data) {
          console.log("Follow requests loaded:", res.data);
          setFollowRequests(res.data.requests || []);
        } else {
          console.error("Failed to load follow requests:", res);
        }
      } else if (activeTab === "blocked") {
        const stored = localStorage.getItem("ps_hidden_users");
        const blockedIds: number[] = stored ? JSON.parse(stored) : [];
        
        if (blockedIds.length > 0) {
          const blockedUsersData = await Promise.all(
            blockedIds.map(async (userId) => {
              try {
                const profileRes = await api.follows.getUserProfile(userId);
                if (profileRes.success && profileRes.data) {
                  const userData = profileRes.data.user;
                  return {
                    id: userId,
                    username: userData.username,
                    name: userData.name,
                    photoUrl: userData.photoUrl,
                  };
                }
              } catch (e) {
                console.error(`Failed to load blocked user ${userId}:`, e);
              }
              return null;
            })
          );
          setBlockedUsers(blockedUsersData.filter(Boolean) as FollowUser[]);
        } else {
          setBlockedUsers([]);
        }
      }
    } catch (error) {
      console.error("Failed to load tab data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleTogglePrivacy = async () => {
    setSavingPrivacy(true);
    try {
      const newValue = !isPrivate;
      const res = await api.profile.updatePrivacy(newValue);
      if (res.success) {
        setIsPrivate(newValue);
        toast.success(`Profile is now ${newValue ? "private" : "public"}`);
        if (refreshUser) await refreshUser();
      } else {
        toast.error(res.message || "Failed to update privacy");
      }
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    setProcessing(requestId);
    try {
      const res = await api.follows.acceptFollowRequest(requestId);
      if (res.success) {
        toast.success("Request accepted");
        setFollowRequests(prev => prev.filter(r => r.id !== requestId));
        setFollowerCount(prev => prev + 1);
        // Reload profile to get updated counts
        loadProfile();
      } else {
        toast.error(res.message || "Failed to accept");
      }
    } catch (error) {
      console.error("Failed to accept request:", error);
      toast.error("Failed to accept request");
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    setProcessing(requestId);
    try {
      const res = await api.follows.rejectFollowRequest(requestId);
      if (res.success) {
        toast.success("Request rejected");
        setFollowRequests(prev => prev.filter(r => r.id !== requestId));
        loadProfile();
      } else {
        toast.error(res.message || "Failed to reject");
      }
    } catch (error) {
      console.error("Failed to reject request:", error);
      toast.error("Failed to reject request");
    } finally {
      setProcessing(null);
    }
  };

  const handleUnblockUser = (userId: number) => {
    const stored = localStorage.getItem("ps_hidden_users");
    const blockedIds: number[] = stored ? JSON.parse(stored) : [];
    const updated = blockedIds.filter(id => id !== userId);
    localStorage.setItem("ps_hidden_users", JSON.stringify(updated));
    setBlockedUsers(prev => prev.filter(u => u.id !== userId));
    toast.success("User unblocked");
  };

  const handleDeletePost = (postId: number) => {
    setPostToDelete(postId);
    setShowDeleteConfirm(true);
  };

  const handleEditPost = (postId: number, currentContent: string, currentMediaUrls: string[]) => {
    setEditingPostId(postId);
    setEditContent(currentContent);
    setExistingMediaUrls(currentMediaUrls);
    setEditMedia([]);
    setEditMediaPreviews([]);
  };

  const cancelEdit = () => {
    setEditingPostId(null);
    setEditContent("");
    setEditMedia([]);
    setEditMediaPreviews([]);
    setExistingMediaUrls([]);
  };

  const handleEditMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles = files.filter(f => f.type.startsWith("image/") || f.type.startsWith("video/"));
    if (validFiles.length === 0) {
      toast.error("Please select valid image or video files");
      return;
    }

    setEditMedia(validFiles);
    const previews = validFiles.map(f => URL.createObjectURL(f));
    setEditMediaPreviews(previews);
  };

  const removeExistingMedia = (index: number) => {
    setExistingMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeEditMedia = (index: number) => {
    setEditMedia(prev => prev.filter((_, i) => i !== index));
    setEditMediaPreviews(prev => {
      const updated = prev.filter((_, i) => i !== index);
      if (prev[index]) URL.revokeObjectURL(prev[index]);
      return updated;
    });
  };

  const saveEdit = async () => {
    if (!editingPostId || !editContent.trim() || savingEdit) return;
    setSavingEdit(true);
    try {
      let finalMediaUrls = [...existingMediaUrls];
      
      // Upload new media if any
      if (editMedia.length > 0) {
        const uploadRes = await api.posts.uploadMedia(editMedia);
        if (uploadRes.success && uploadRes.data?.mediaUrls) {
          finalMediaUrls = [...finalMediaUrls, ...uploadRes.data.mediaUrls];
        } else {
          toast.error("Failed to upload media");
          setSavingEdit(false);
          return;
        }
      }

      const res = await api.posts.edit(editingPostId, editContent.trim(), finalMediaUrls);
      if (res.success && res.data?.post) {
        setPosts(prev => prev.map(p => p.id === editingPostId ? { 
          ...p, 
          content: editContent.trim(),
          mediaUrls: finalMediaUrls 
        } : p));
        toast.success("Post updated successfully");
        cancelEdit();
      } else {
        toast.error(res.message || "Failed to update post");
      }
    } catch (error) {
      console.error("Failed to update post:", error);
      toast.error("Failed to update post");
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    setDeletingPostId(postToDelete);
    setShowDeleteConfirm(false);
    try {
      const res = await api.posts.delete(postToDelete);
      if (res.success) {
        setPosts(prev => prev.filter(p => p.id !== postToDelete));
        setPostCount(prev => prev - 1);
        toast.success("Post deleted successfully");
      } else {
        toast.error(res.message || "Failed to delete post");
      }
    } catch (error) {
      console.error("Failed to delete post:", error);
      toast.error("Failed to delete post");
    } finally {
      setDeletingPostId(null);
      setPostToDelete(null);
    }
  };

  const handleRemoveFollower = async (userId: number) => {
    const ok = await confirm({
      title: "Remove follower?",
      message: "They will no longer see your posts in their feed. You can re-approve them later if they re-follow you.",
      confirmText: "Remove",
      cancelText: "Cancel",
      confirmColor: "#EF4444",
    });
    if (!ok) return;
    try {
      const res = await api.follows.removeFollower(userId);
      if (res.success) {
        toast.success("Follower removed");
        setFollowers(prev => prev.filter(f => f.id !== userId));
        setFollowerCount(prev => prev - 1);
      } else {
        toast.error(res.message || "Failed to remove follower");
      }
    } catch (error) {
      toast.error("Failed to remove follower");
    }
  };

  if (loading) return <GolfLoader text="Loading profile..." />;

  return (
    <>
      <style jsx>{`
        @media (max-width: 640px) {
          .profile-container {
            padding: 12px !important;
          }
          .profile-header {
            padding: 16px 12px !important;
          }
          .profile-info {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 12px !important;
          }
          .profile-avatar {
            width: 56px !important;
            height: 56px !important;
            font-size: 18px !important;
          }
          .profile-name {
            font-size: 16px !important;
          }
          .profile-username {
            font-size: 11px !important;
          }
          .privacy-toggle {
            position: static !important;
            width: 100% !important;
            margin-bottom: 16px !important;
            padding: 10px 12px !important;
            gap: 8px !important;
            justify-content: center !important;
          }
          .privacy-toggle svg {
            flex-shrink: 0 !important;
          }
          .privacy-toggle span {
            font-size: 12px !important;
            flex: 1 !important;
            text-align: left !important;
          }
          .privacy-toggle button {
            width: 40px !important;
            height: 22px !important;
            margin-left: 0 !important;
            flex-shrink: 0 !important;
          }
          .privacy-toggle button div {
            width: 16px !important;
            height: 16px !important;
            top: 3px !important;
            left: 3px !important;
          }
          .privacy-toggle button div.active {
            left: 21px !important;
          }
          .stats-container {
            gap: 12px !important;
            padding-top: 14px !important;
          }
          .stat-value {
            font-size: 16px !important;
          }
          .stat-label {
            font-size: 10px !important;
          }
          .tabs-container {
            gap: 4px !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .tab-button {
            padding: 10px 14px !important;
            font-size: 12px !important;
            white-space: nowrap !important;
            flex-shrink: 0 !important;
          }
          .tab-content {
            padding: 12px 0 !important;
          }
          .search-input {
            display: none !important;
          }
          .back-button {
            font-size: 12px !important;
          }
          .follower-card {
            padding: 12px !important;
            gap: 12px !important;
          }
          .follower-avatar {
            width: 44px !important;
            height: 44px !important;
            font-size: 14px !important;
          }
          .follower-name {
            font-size: 14px !important;
          }
          .follower-username {
            font-size: 12px !important;
          }
          .follower-button {
            padding: 6px 12px !important;
            font-size: 12px !important;
          }
          .post-card {
            border-radius: 8px !important;
          }
          .empty-state-icon {
            width: 60px !important;
            height: 60px !important;
          }
          .empty-state-title {
            font-size: 14px !important;
          }
          .empty-state-text {
            font-size: 12px !important;
          }
        }
      `}</style>
      <div className="profile-container" style={{ maxWidth: "900px", margin: "0 auto", padding: "20px", fontFamily: "var(--font-poppins), sans-serif" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <button
          onClick={() => router.back()}
          className="back-button"
          style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#888", fontSize: "13px", cursor: "pointer" }}
        >
          <FiArrowLeft size={14} /> Back
        </button>
        
        {activeTab === "followers" && followers.length > 0 && (
          <input
            type="text"
            placeholder="Search followers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
            style={{
              width: "300px",
              padding: "10px 16px",
              backgroundColor: "transparent",
              border: "1px solid #1E2A47",
              borderRadius: "5px",
              color: "#FFF",
              fontSize: "13px",
              outline: "none",
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = "#E8C96A"}
            onBlur={(e) => e.currentTarget.style.borderColor = "#1E2A47"}
          />
        )}
      </div>

      {/* Profile Header */}
      <div className="profile-header" style={{ backgroundColor: "#13192A", borderRadius: "8px", padding: "28px 24px", marginBottom: "20px", position: "relative" }}>
        {/* Privacy Toggle - Top Right */}
        <div className="privacy-toggle" style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "8px 14px",
          backgroundColor: "#060D1F",
          borderRadius: "6px",
          border: "1px solid #1E2A47",
        }}>
          {isPrivate ? <FiLock size={16} color="#E8C96A" /> : <FiUnlock size={16} color="#888" />}
          <span style={{ color: "#FFF", fontSize: "13px", fontWeight: 500 }}>
            {isPrivate ? "Private" : "Public"}
          </span>
          <button
            onClick={handleTogglePrivacy}
            disabled={savingPrivacy}
            style={{
              position: "relative",
              width: "42px",
              height: "22px",
              backgroundColor: isPrivate ? "#E8C96A" : "#1E2A47",
              borderRadius: "11px",
              border: "none",
              cursor: savingPrivacy ? "not-allowed" : "pointer",
              transition: "background-color 0.2s",
              opacity: savingPrivacy ? 0.6 : 1,
              marginLeft: "4px",
              flexShrink: 0,
            }}
          >
            <div className={isPrivate ? "active" : ""} style={{
              position: "absolute",
              top: "3px",
              left: isPrivate ? "22px" : "3px",
              width: "16px",
              height: "16px",
              backgroundColor: "#FFF",
              borderRadius: "50%",
              transition: "left 0.2s",
            }} />
          </button>
        </div>

        <div className="profile-info" style={{ display: "flex", alignItems: "flex-start", gap: "20px", marginBottom: "20px" }}>
          <div className="profile-avatar" style={{
            width: "80px", height: "80px", borderRadius: "8px",
            backgroundColor: "#060D1F",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#E8C96A", fontSize: "28px", fontWeight: 700,
            flexShrink: 0, overflow: "hidden",
          }}>
            {user?.photoUrl ? (
              <Image 
                src={resolveMediaUrl(user.photoUrl)} 
                alt={user.name || "Profile"} 
                width={80} 
                height={80} 
                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                unoptimized 
              />
            ) : (
              user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U"
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="profile-name" style={{ color: "#E8C96A", fontSize: "22px", fontWeight: 600, marginBottom: "4px" }}>{user?.name}</div>
            <div className="profile-username" style={{ color: "#888", fontSize: "14px" }}>@{user?.username}</div>
            {user?.country && (
              <div style={{ color: "#666", fontSize: "12px", marginTop: "4px" }}>{user.country}</div>
            )}
            {userBio && (
              <div style={{ color: "#CCC", fontSize: "13px", lineHeight: "1.6", marginTop: "12px" }}>{userBio}</div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="stats-container" style={{ display: "flex", gap: "24px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "18px" }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div className="stat-value" style={{ color: "#FFF", fontSize: "20px", fontWeight: 600 }}>{postCount}</div>
            <div className="stat-label" style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "3px" }}>Posts</div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div className="stat-value" style={{ color: "#FFF", fontSize: "20px", fontWeight: 600 }}>{followerCount}</div>
            <div className="stat-label" style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "3px" }}>Followers</div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div className="stat-value" style={{ color: "#FFF", fontSize: "20px", fontWeight: 600 }}>{followingCount}</div>
            <div className="stat-label" style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "3px" }}>Following</div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div className="stat-value" style={{ color: "#FFF", fontSize: "20px", fontWeight: 600 }}>{blockedUsers.length}</div>
            <div className="stat-label" style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "3px" }}>Blocked</div>
          </div>
          {isPrivate && (
            <div style={{ flex: 1, textAlign: "center" }}>
              <div className="stat-value" style={{ color: "#FFF", fontSize: "20px", fontWeight: 600 }}>{followRequests.length}</div>
              <div className="stat-label" style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "3px" }}>Requests</div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container" style={{ display: "flex", gap: "8px", marginBottom: "20px", borderBottom: "1px solid #1E2A47" }}>
        <button
          onClick={() => setActiveTab("posts")}
          className="tab-button"
          style={{
            background: "none",
            border: "none",
            padding: "12px 20px",
            color: activeTab === "posts" ? "#E8C96A" : "#888",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            borderBottom: activeTab === "posts" ? "2px solid #E8C96A" : "2px solid transparent",
            transition: "all 0.2s",
          }}
        >
          Posts ({postCount})
        </button>
        <button
          onClick={() => setActiveTab("followers")}
          className="tab-button"
          style={{
            background: "none",
            border: "none",
            padding: "12px 20px",
            color: activeTab === "followers" ? "#E8C96A" : "#888",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            borderBottom: activeTab === "followers" ? "2px solid #E8C96A" : "2px solid transparent",
            transition: "all 0.2s",
          }}
        >
          Followers ({followerCount})
        </button>
        <button
          onClick={() => setActiveTab("following")}
          className="tab-button"
          style={{
            background: "none",
            border: "none",
            padding: "12px 20px",
            color: activeTab === "following" ? "#E8C96A" : "#888",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            borderBottom: activeTab === "following" ? "2px solid #E8C96A" : "2px solid transparent",
            transition: "all 0.2s",
          }}
        >
          Following ({followingCount})
        </button>
        {isPrivate && (
          <button
            onClick={() => setActiveTab("requests")}
            className="tab-button"
            style={{
              background: "none",
              border: "none",
              padding: "12px 20px",
              color: activeTab === "requests" ? "#E8C96A" : "#888",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              borderBottom: activeTab === "requests" ? "2px solid #E8C96A" : "2px solid transparent",
              transition: "all 0.2s",
              position: "relative",
            }}
          >
            Requests ({followRequests.length})
            {followRequests.length > 0 && (
              <span style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                width: "8px",
                height: "8px",
                backgroundColor: "#E8C96A",
                borderRadius: "50%",
              }} />
            )}
          </button>
        )}
        <button
          onClick={() => setActiveTab("blocked")}
          className="tab-button"
          style={{
            background: "none",
            border: "none",
            padding: "12px 20px",
            color: activeTab === "blocked" ? "#E8C96A" : "#888",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            borderBottom: activeTab === "blocked" ? "2px solid #E8C96A" : "2px solid transparent",
            transition: "all 0.2s",
          }}
        >
          Blocked ({blockedUsers.length})
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content" style={{ padding: "20px 0", minHeight: "300px" }}>
        {loadingData ? (
          <GolfLoader text="Loading..." />
        ) : (
          <>
            {/* Posts Tab */}
            {activeTab === "posts" && (
              <div>
                {posts.length === 0 ? (
                  <div style={{ padding: "60px 20px", textAlign: "center" }}>
                    <div style={{
                      width: "80px",
                      height: "80px",
                      margin: "0 auto 16px",
                      backgroundColor: "#060D1F",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <FiUsers size={36} color="#888" />
                    </div>
                    <div style={{ color: "#FFF", fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>No posts yet</div>
                    <div style={{ color: "#888", fontSize: "13px" }}>Share your first post with the community</div>
                  </div>
                ) : (
                  <div style={{ 
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    maxWidth: "600px",
                    margin: "0 auto",
                    padding: "0",
                  }}>
                    {posts.map((post, index) => {
                      const isReshare = !!post.originalPost;
                      const displayContent = isReshare 
                        ? (post.reshareComment || post.originalPost?.content || "")
                        : post.content;
                      
                      // Parse mediaUrls if it's a string
                      let mediaUrls = [];
                      if (isReshare) {
                        const originalMedia = post.originalPost?.mediaUrls;
                        if (Array.isArray(originalMedia)) {
                          mediaUrls = originalMedia;
                        } else if (typeof originalMedia === 'string') {
                          try {
                            mediaUrls = JSON.parse(originalMedia);
                          } catch {
                            mediaUrls = [];
                          }
                        }
                      } else {
                        const postMedia = post.mediaUrls;
                        if (Array.isArray(postMedia)) {
                          mediaUrls = postMedia;
                        } else if (typeof postMedia === 'string') {
                          try {
                            mediaUrls = JSON.parse(postMedia);
                          } catch {
                            mediaUrls = [];
                          }
                        }
                      }
                      const hasMedia = mediaUrls.length > 0;
                      const isDeleting = deletingPostId === post.id;
                      const isEditing = editingPostId === post.id;
                      
                      return (
                        <div
                          key={post.id}
                          style={{
                            backgroundColor: "#13192A",
                            borderRadius: "10px",
                            border: "none",
                            transition: "all 0.2s",
                            overflow: "hidden",
                            width: "100%",
                            position: "relative",
                            opacity: isDeleting ? 0.5 : 1,
                            pointerEvents: isDeleting ? "none" : "auto",
                          }}
                          onMouseEnter={(e) => {
                            if (!isDeleting) {
                              e.currentTarget.style.transform = "translateY(-2px)";
                              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                        >
                          {/* Post Header with Author Info and Action Buttons */}
                          <div style={{ padding: "16px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: 0 }}>
                              <div
                                onClick={() => router.push(`/user/${user?.id}`)}
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "8px",
                                  backgroundColor: "#060D1F",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#E8C96A",
                                  fontSize: "14px",
                                  fontWeight: 700,
                                  flexShrink: 0,
                                  overflow: "hidden",
                                  cursor: "pointer",
                                }}
                              >
                                {user?.photoUrl ? (
                                  <Image 
                                    src={resolveMediaUrl(user.photoUrl)} 
                                    alt={user.name || "Profile"} 
                                    width={40} 
                                    height={40} 
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                                    unoptimized 
                                  />
                                ) : (
                                  user?.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "U"
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  onClick={() => router.push(`/user/${user?.id}`)}
                                  style={{
                                    color: "#E8C96A",
                                    fontWeight: 600,
                                    fontSize: "14px",
                                    cursor: "pointer",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {user?.name}
                                </div>
                                <div style={{ color: "#888", fontSize: "12px", marginTop: "2px" }}>
                                  @{user?.username} · {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                              </div>
                            </div>
                            {!isEditing && (
                              <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                                {!isReshare && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditPost(post.id, post.content, mediaUrls);
                                    }}
                                    disabled={isDeleting}
                                    style={{
                                      background: "rgba(232,201,106,0.1)",
                                      border: "1px solid rgba(232,201,106,0.3)",
                                      borderRadius: "6px",
                                      padding: "8px",
                                      cursor: isDeleting ? "not-allowed" : "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      transition: "all 0.2s",
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!isDeleting) {
                                        e.currentTarget.style.background = "rgba(232,201,106,0.2)";
                                        e.currentTarget.style.borderColor = "#E8C96A";
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = "rgba(232,201,106,0.1)";
                                      e.currentTarget.style.borderColor = "rgba(232,201,106,0.3)";
                                    }}
                                  >
                                    <FiEdit2 size={16} color="#E8C96A" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeletePost(post.id);
                                  }}
                                  disabled={isDeleting}
                                  style={{
                                    background: "rgba(239,68,68,0.1)",
                                    border: "1px solid rgba(239,68,68,0.3)",
                                    borderRadius: "6px",
                                    padding: "8px",
                                    cursor: isDeleting ? "not-allowed" : "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    transition: "all 0.2s",
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isDeleting) {
                                      e.currentTarget.style.background = "rgba(239,68,68,0.2)";
                                      e.currentTarget.style.borderColor = "#EF4444";
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                                    e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)";
                                  }}
                                >
                                  <FiTrash2 size={16} color="#EF4444" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Post Content */}
                          <div style={{ padding: "0 16px 16px" }}>
                            {isReshare && (
                              <div style={{
                                padding: "8px 12px",
                                backgroundColor: "rgba(232,201,106,0.1)",
                                borderRadius: "6px",
                                marginBottom: "12px",
                                fontSize: "11px",
                                color: "#E8C96A",
                                fontWeight: 600,
                              }}>
                                🔄 Reshared from @{post.originalPost?.user?.username}
                              </div>
                            )}
                            {isEditing ? (
                              <div style={{ marginBottom: "12px" }}>
                                <textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  style={{
                                    width: "100%",
                                    minHeight: "100px",
                                    padding: "12px",
                                    backgroundColor: "#060D1F",
                                    border: "1px solid #1E2A47",
                                    borderRadius: "8px",
                                    color: "#FFF",
                                    fontSize: "14px",
                                    fontFamily: "inherit",
                                    resize: "vertical",
                                    outline: "none",
                                  }}
                                  onFocus={(e) => e.currentTarget.style.borderColor = "#E8C96A"}
                                  onBlur={(e) => e.currentTarget.style.borderColor = "#1E2A47"}
                                />
                                
                                {/* Existing Media */}
                                {existingMediaUrls.length > 0 && (
                                  <div style={{ marginTop: "12px" }}>
                                    <div style={{ color: "#888", fontSize: "12px", marginBottom: "8px" }}>Current Media:</div>
                                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                      {existingMediaUrls.map((url, idx) => (
                                        <div key={idx} style={{ position: "relative", width: "100px", height: "100px" }}>
                                          <Image
                                            src={resolveMediaUrl(url)}
                                            alt="Media"
                                            width={100}
                                            height={100}
                                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
                                            unoptimized
                                          />
                                          <button
                                            onClick={() => removeExistingMedia(idx)}
                                            style={{
                                              position: "absolute",
                                              top: "4px",
                                              right: "4px",
                                              width: "24px",
                                              height: "24px",
                                              borderRadius: "50%",
                                              backgroundColor: "rgba(0,0,0,0.7)",
                                              border: "none",
                                              color: "#FFF",
                                              cursor: "pointer",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              fontSize: "16px",
                                            }}
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* New Media Previews */}
                                {editMediaPreviews.length > 0 && (
                                  <div style={{ marginTop: "12px" }}>
                                    <div style={{ color: "#888", fontSize: "12px", marginBottom: "8px" }}>New Media:</div>
                                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                      {editMediaPreviews.map((preview, idx) => (
                                        <div key={idx} style={{ position: "relative", width: "100px", height: "100px" }}>
                                          <img
                                            src={preview}
                                            alt="Preview"
                                            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "8px" }}
                                          />
                                          <button
                                            onClick={() => removeEditMedia(idx)}
                                            style={{
                                              position: "absolute",
                                              top: "4px",
                                              right: "4px",
                                              width: "24px",
                                              height: "24px",
                                              borderRadius: "50%",
                                              backgroundColor: "rgba(0,0,0,0.7)",
                                              border: "none",
                                              color: "#FFF",
                                              cursor: "pointer",
                                              display: "flex",
                                              alignItems: "center",
                                              justifyContent: "center",
                                              fontSize: "16px",
                                            }}
                                          >
                                            ×
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {/* Add Media Button */}
                                <div style={{ marginTop: "12px" }}>
                                  <input
                                    type="file"
                                    accept="image/*,video/*"
                                    multiple
                                    onChange={handleEditMediaSelect}
                                    style={{ display: "none" }}
                                    id={`edit-media-${post.id}`}
                                  />
                                  <label
                                    htmlFor={`edit-media-${post.id}`}
                                    style={{
                                      display: "inline-flex",
                                      alignItems: "center",
                                      gap: "8px",
                                      padding: "8px 16px",
                                      backgroundColor: "rgba(232,201,106,0.1)",
                                      border: "1px solid rgba(232,201,106,0.3)",
                                      borderRadius: "6px",
                                      color: "#E8C96A",
                                      fontSize: "13px",
                                      fontWeight: 600,
                                      cursor: "pointer",
                                      transition: "all 0.2s",
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.backgroundColor = "rgba(232,201,106,0.2)";
                                      e.currentTarget.style.borderColor = "#E8C96A";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = "rgba(232,201,106,0.1)";
                                      e.currentTarget.style.borderColor = "rgba(232,201,106,0.3)";
                                    }}
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                                      <circle cx="8.5" cy="8.5" r="1.5"/>
                                      <polyline points="21 15 16 10 5 21"/>
                                    </svg>
                                    Add/Change Media
                                  </label>
                                </div>

                                <div style={{ display: "flex", gap: "8px", marginTop: "12px", justifyContent: "flex-end" }}>
                                  <button
                                    onClick={cancelEdit}
                                    disabled={savingEdit}
                                    style={{
                                      padding: "8px 16px",
                                      backgroundColor: "transparent",
                                      color: "#888",
                                      border: "1px solid #1E2A47",
                                      borderRadius: "6px",
                                      fontSize: "13px",
                                      fontWeight: 600,
                                      cursor: savingEdit ? "not-allowed" : "pointer",
                                      transition: "all 0.2s",
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!savingEdit) {
                                        e.currentTarget.style.borderColor = "#E8C96A";
                                        e.currentTarget.style.color = "#E8C96A";
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.borderColor = "#1E2A47";
                                      e.currentTarget.style.color = "#888";
                                    }}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={saveEdit}
                                    disabled={savingEdit || !editContent.trim()}
                                    style={{
                                      padding: "8px 16px",
                                      backgroundColor: "#E8C96A",
                                      color: "#01050D",
                                      border: "none",
                                      borderRadius: "6px",
                                      fontSize: "13px",
                                      fontWeight: 600,
                                      cursor: (savingEdit || !editContent.trim()) ? "not-allowed" : "pointer",
                                      opacity: (savingEdit || !editContent.trim()) ? 0.5 : 1,
                                      transition: "all 0.2s",
                                    }}
                                    onMouseEnter={(e) => {
                                      if (!savingEdit && editContent.trim()) {
                                        e.currentTarget.style.backgroundColor = "#F5D97A";
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.backgroundColor = "#E8C96A";
                                    }}
                                  >
                                    {savingEdit ? "Saving..." : "Save"}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() => !isEditing && router.push(`/post/${post.id}`)}
                                style={{
                                  color: "#FFF",
                                  fontSize: "14px",
                                  lineHeight: "1.6",
                                  marginBottom: hasMedia ? "12px" : "0",
                                  wordBreak: "break-word",
                                  cursor: "pointer",
                                }}
                              >
                                {displayContent}
                              </div>
                            )}
                          </div>

                          {/* Media Section */}
                          {hasMedia && !isEditing && (
                            <div style={{
                              display: "grid",
                              gridTemplateColumns: mediaUrls.length === 1 ? "1fr" : "repeat(2, 1fr)",
                              gridTemplateRows: mediaUrls.length > 2 ? "repeat(2, 1fr)" : "auto",
                              gap: "2px",
                              backgroundColor: "#060D1F",
                            }}>
                              {mediaUrls.slice(0, mediaUrls.length === 1 ? 1 : 4).map((url: string, idx: number) => {
                                const isVideo = /\.(mp4|mov|avi|mkv|webm)(\?|$)/i.test(url) || url.includes("/video/");
                                const fullUrl = resolveMediaUrl(url);
                                const isLastItem = idx === 3 && mediaUrls.length > 4;
                                const remainingCount = mediaUrls.length - 4;
                                
                                if (isVideo) {
                                  return (
                                    <div
                                      key={idx}
                                      style={{
                                        position: "relative",
                                        overflow: "hidden",
                                        backgroundColor: "#000",
                                        aspectRatio: "16 / 9",
                                      }}
                                    >
                                      <video
                                        src={fullUrl}
                                        controls
                                        style={{ width: "100%", height: "100%", display: "block", objectFit: "contain", backgroundColor: "#000" }}
                                      />
                                    </div>
                                  );
                                }
                                return (
                                  <div
                                    key={idx}
                                    style={{
                                      position: "relative",
                                      overflow: "hidden",
                                      backgroundColor: "#000",
                                      aspectRatio: mediaUrls.length === 1 ? "4 / 3" : "1 / 1",
                                      maxHeight: mediaUrls.length === 1 ? "440px" : "320px",
                                      width: "100%",
                                    }}
                                  >
                                    <img
                                      src={fullUrl}
                                      alt="Post media"
                                      loading="lazy"
                                      style={{
                                        width: "100%",
                                        height: "100%",
                                        display: "block",
                                        objectFit: "cover",
                                        objectPosition: "center",
                                        filter: isLastItem ? "brightness(0.4)" : "none",
                                      }}
                                    />
                                    {isLastItem && (
                                      <div
                                        style={{
                                          position: "absolute",
                                          inset: 0,
                                          display: "flex",
                                          alignItems: "center",
                                          justifyContent: "center",
                                          backgroundColor: "rgba(0, 0, 0, 0.6)",
                                          color: "#FFFFFF",
                                          fontSize: "32px",
                                          fontWeight: 700,
                                          cursor: "pointer",
                                          pointerEvents: "none",
                                        }}
                                      >
                                        +{remainingCount}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Engagement Stats */}
                          <div 
                            onClick={() => !isEditing && router.push(`/post/${post.id}`)}
                            style={{ padding: "12px 16px", cursor: isEditing ? "default" : "pointer" }}
                          >
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}>
                              <div style={{ display: "flex", gap: "16px", color: "#888", fontSize: "13px" }}>
                                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#EF4444" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                                  </svg>
                                  <span style={{ color: "#FFF" }}>{post._count.likes}</span>
                                </span>
                                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <Image src="/icons/reply.svg" alt="" width={16} height={16} style={{ filter: "grayscale(1) brightness(0.7)" }} />
                                  <span style={{ color: "#FFF" }}>{post._count.comments}</span>
                                </span>
                                {(post.shareCount ?? 0) > 0 && (
                                  <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <polyline points="23 4 23 10 17 10" />
                                      <polyline points="1 20 1 14 7 14" />
                                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                                    </svg>
                                    <span style={{ color: "#FFF" }}>{post.shareCount}</span>
                                  </span>
                                )}
                              </div>
                              <div style={{ color: "#666", fontSize: "11px" }}>
                                {new Date(post.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Followers Tab */}
            {activeTab === "followers" && (
              <div>
                {followers.length === 0 ? (
                  <div style={{ padding: "60px 20px", textAlign: "center" }}>
                    <div style={{
                      width: "80px",
                      height: "80px",
                      margin: "0 auto 16px",
                      backgroundColor: "#060D1F",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <FiUsers size={36} color="#888" />
                    </div>
                    <div style={{ color: "#FFF", fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>No followers yet</div>
                    <div style={{ color: "#888", fontSize: "13px" }}>People who follow you will appear here</div>
                  </div>
                ) : (
                  <div style={{ maxWidth: "600px", margin: "0 auto" }}>
                    <div style={{ marginBottom: "20px", color: "#888", fontSize: "13px", fontWeight: 500 }}>
                      {followers.filter(f => 
                        f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        f.username.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length} followers
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {followers.filter(follower => 
                        follower.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        follower.username.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length === 0 ? (
                        <div style={{ padding: "40px", textAlign: "center", color: "#888", fontSize: "13px" }}>
                          No followers found
                        </div>
                      ) : (
                        followers.filter(follower => 
                          follower.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          follower.username.toLowerCase().includes(searchQuery.toLowerCase())
                        ).map(follower => (
                        <div
                          key={follower.id}
                          className="follower-card"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            padding: "16px 20px",
                            backgroundColor: "transparent",
                            borderRadius: "5px",
                            border: "1px solid #1E2A47",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#E8C96A";
                            e.currentTarget.style.backgroundColor = "rgba(232,201,106,0.03)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#1E2A47";
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <div
                            onClick={() => router.push(`/user/${follower.id}`)}
                            className="follower-avatar"
                            style={{
                              width: "56px",
                              height: "56px",
                              borderRadius: "8px",
                              backgroundColor: "#1E2A47",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#E8C96A",
                              fontSize: "18px",
                              fontWeight: 700,
                              flexShrink: 0,
                              overflow: "hidden",
                              cursor: "pointer",
                              border: "2px solid transparent",
                              transition: "border-color 0.2s",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = "#E8C96A"}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
                          >
                            {follower.photoUrl ? (
                              <Image
                                src={resolveMediaUrl(follower.photoUrl)}
                                alt={follower.name}
                                width={56}
                                height={56}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                unoptimized
                              />
                            ) : (
                              follower.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                            )}
                          </div>
                          <div
                            onClick={() => router.push(`/user/${follower.id}`)}
                            style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                          >
                            <div className="follower-name" style={{ color: "#FFF", fontSize: "15px", fontWeight: 600, marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {follower.name}
                            </div>
                            <div className="follower-username" style={{ color: "#888", fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              @{follower.username}
                            </div>
                          </div>
                          <button
                            onClick={() => handleRemoveFollower(follower.id)}
                            className="follower-button"
                            style={{
                              padding: "8px 16px",
                              backgroundColor: "transparent",
                              color: "#888",
                              border: "1px solid #1E2A47",
                              borderRadius: "5px",
                              fontSize: "13px",
                              fontWeight: 600,
                              cursor: "pointer",
                              flexShrink: 0,
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "rgba(248,113,113,0.1)";
                              e.currentTarget.style.borderColor = "#F87171";
                              e.currentTarget.style.color = "#F87171";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "transparent";
                              e.currentTarget.style.borderColor = "#1E2A47";
                              e.currentTarget.style.color = "#888";
                            }}
                          >
                            Remove
                          </button>
                        </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Following Tab */}
            {activeTab === "following" && (
              <div>
                {following.length === 0 ? (
                  <div style={{ padding: "60px 20px", textAlign: "center" }}>
                    <div style={{
                      width: "80px",
                      height: "80px",
                      margin: "0 auto 16px",
                      backgroundColor: "#060D1F",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <FiUserPlus size={36} color="#888" />
                    </div>
                    <div style={{ color: "#FFF", fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>Not following anyone yet</div>
                    <div style={{ color: "#888", fontSize: "13px" }}>Discover and follow people in the community</div>
                  </div>
                ) : (
                  <div style={{ maxWidth: "600px", margin: "0 auto" }}>
                    <div style={{ marginBottom: "20px", color: "#888", fontSize: "13px", fontWeight: 500 }}>
                      {following.length} following
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {following.map(user => (
                        <div
                          key={user.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            padding: "16px 20px",
                            backgroundColor: "transparent",
                            borderRadius: "5px",
                            border: "1px solid #1E2A47",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#E8C96A";
                            e.currentTarget.style.backgroundColor = "rgba(232,201,106,0.03)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#1E2A47";
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <div
                            onClick={() => router.push(`/user/${user.id}`)}
                            style={{
                              width: "56px",
                              height: "56px",
                              borderRadius: "8px",
                              backgroundColor: "#1E2A47",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#E8C96A",
                              fontSize: "18px",
                              fontWeight: 700,
                              flexShrink: 0,
                              overflow: "hidden",
                              cursor: "pointer",
                              border: "2px solid transparent",
                              transition: "border-color 0.2s",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = "#E8C96A"}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
                          >
                            {user.photoUrl ? (
                              <Image
                                src={resolveMediaUrl(user.photoUrl)}
                                alt={user.name}
                                width={56}
                                height={56}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                unoptimized
                              />
                            ) : (
                              user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                            )}
                          </div>
                          <div
                            onClick={() => router.push(`/user/${user.id}`)}
                            style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                          >
                            <div style={{ color: "#FFF", fontSize: "15px", fontWeight: 600, marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {user.name}
                            </div>
                            <div style={{ color: "#888", fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              @{user.username}
                            </div>
                          </div>
                          <button
                            style={{
                              padding: "8px 16px",
                              backgroundColor: "#E8C96A",
                              color: "#01050D",
                              border: "none",
                              borderRadius: "5px",
                              fontSize: "13px",
                              fontWeight: 600,
                              cursor: "pointer",
                              flexShrink: 0,
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#F5D97A";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#E8C96A";
                            }}
                          >
                            Following
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Follow Requests Tab */}
            {activeTab === "requests" && (
              <div>
                {followRequests.length === 0 ? (
                  <div style={{ padding: "60px 20px", textAlign: "center" }}>
                    <div style={{
                      width: "80px",
                      height: "80px",
                      margin: "0 auto 16px",
                      backgroundColor: "#060D1F",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <FiUserPlus size={36} color="#888" />
                    </div>
                    <div style={{ color: "#FFF", fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>No pending requests</div>
                    <div style={{ color: "#888", fontSize: "13px" }}>Follow requests will appear here</div>
                  </div>
                ) : (
                  <div>
                    <div style={{ marginBottom: "16px", padding: "12px 16px", backgroundColor: "rgba(232,201,106,0.1)", border: "1px solid rgba(232,201,106,0.3)", borderRadius: "8px" }}>
                      <div style={{ color: "#E8C96A", fontSize: "13px", fontWeight: 600 }}>
                        {followRequests.length} pending {followRequests.length === 1 ? 'request' : 'requests'}
                      </div>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {followRequests.map(req => (
                        <div
                          key={req.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            padding: "16px",
                            backgroundColor: "#060D1F",
                            borderRadius: "12px",
                            border: "1px solid #1E2A47",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#E8C96A";
                            e.currentTarget.style.backgroundColor = "rgba(232,201,106,0.05)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#1E2A47";
                            e.currentTarget.style.backgroundColor = "#060D1F";
                          }}
                        >
                          <div
                            onClick={() => router.push(`/user/${req.senderId}`)}
                            style={{
                              width: "56px",
                              height: "56px",
                              borderRadius: "10px",
                              backgroundColor: "#1E2A47",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#E8C96A",
                              fontSize: "18px",
                              fontWeight: 700,
                              flexShrink: 0,
                              overflow: "hidden",
                              cursor: "pointer",
                              border: "2px solid #1E2A47",
                              transition: "border-color 0.2s",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = "#E8C96A"}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = "#1E2A47"}
                          >
                            {req.photoUrl ? (
                              <Image
                                src={resolveMediaUrl(req.photoUrl)}
                                alt={req.name}
                                width={56}
                                height={56}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                unoptimized
                              />
                            ) : (
                              req.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                            )}
                          </div>
                          <div
                            onClick={() => router.push(`/user/${req.senderId}`)}
                            style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                          >
                            <div style={{ color: "#FFF", fontSize: "15px", fontWeight: 600, marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {req.name}
                            </div>
                            <div style={{ color: "#888", fontSize: "12px", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              @{req.username}
                            </div>
                            <div style={{ color: "#666", fontSize: "11px" }}>
                              {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                            <button
                              onClick={() => handleAcceptRequest(req.id)}
                              disabled={processing === req.id}
                              style={{
                                padding: "10px 20px",
                                backgroundColor: "#E8C96A",
                                color: "#01050D",
                                border: "none",
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontWeight: 700,
                                cursor: processing === req.id ? "not-allowed" : "pointer",
                                opacity: processing === req.id ? 0.6 : 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                minWidth: "100px",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                if (processing !== req.id) {
                                  e.currentTarget.style.backgroundColor = "#F5D97A";
                                  e.currentTarget.style.transform = "scale(1.02)";
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#E8C96A";
                                e.currentTarget.style.transform = "scale(1)";
                              }}
                            >
                              <FiCheck size={16} /> Accept
                            </button>
                            <button
                              onClick={() => handleRejectRequest(req.id)}
                              disabled={processing === req.id}
                              style={{
                                padding: "10px 20px",
                                backgroundColor: "transparent",
                                color: "#888",
                                border: "1px solid #1E2A47",
                                borderRadius: "8px",
                                fontSize: "13px",
                                fontWeight: 700,
                                cursor: processing === req.id ? "not-allowed" : "pointer",
                                opacity: processing === req.id ? 0.6 : 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "6px",
                                minWidth: "100px",
                                transition: "all 0.2s",
                              }}
                              onMouseEnter={(e) => {
                                if (processing !== req.id) {
                                  e.currentTarget.style.backgroundColor = "rgba(248,113,113,0.1)";
                                  e.currentTarget.style.borderColor = "#F87171";
                                  e.currentTarget.style.color = "#F87171";
                                }
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "transparent";
                                e.currentTarget.style.borderColor = "#1E2A47";
                                e.currentTarget.style.color = "#888";
                              }}
                            >
                              <FiX size={16} /> Reject
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Blocked Users Tab */}
            {activeTab === "blocked" && (
              <div>
                {blockedUsers.length === 0 ? (
                  <div style={{ padding: "60px 20px", textAlign: "center" }}>
                    <div style={{
                      width: "80px",
                      height: "80px",
                      margin: "0 auto 16px",
                      backgroundColor: "#060D1F",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <FiX size={36} color="#888" />
                    </div>
                    <div style={{ color: "#FFF", fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>No blocked users</div>
                    <div style={{ color: "#888", fontSize: "13px" }}>Users you block will appear here</div>
                  </div>
                ) : (
                  <div style={{ maxWidth: "600px", margin: "0 auto" }}>
                    <div style={{ marginBottom: "20px", color: "#888", fontSize: "13px", fontWeight: 500 }}>
                      {blockedUsers.length} blocked {blockedUsers.length === 1 ? 'user' : 'users'}
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {blockedUsers.map(user => (
                        <div
                          key={user.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            padding: "16px 20px",
                            backgroundColor: "transparent",
                            borderRadius: "5px",
                            border: "1px solid #1E2A47",
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = "#E8C96A";
                            e.currentTarget.style.backgroundColor = "rgba(232,201,106,0.03)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = "#1E2A47";
                            e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <div
                            onClick={() => router.push(`/user/${user.id}`)}
                            style={{
                              width: "56px",
                              height: "56px",
                              borderRadius: "8px",
                              backgroundColor: "#1E2A47",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#E8C96A",
                              fontSize: "18px",
                              fontWeight: 700,
                              flexShrink: 0,
                              overflow: "hidden",
                              cursor: "pointer",
                              border: "2px solid transparent",
                              transition: "border-color 0.2s",
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = "#E8C96A"}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = "transparent"}
                          >
                            {user.photoUrl ? (
                              <Image
                                src={resolveMediaUrl(user.photoUrl)}
                                alt={user.name}
                                width={56}
                                height={56}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                unoptimized
                              />
                            ) : (
                              user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                            )}
                          </div>
                          <div
                            onClick={() => router.push(`/user/${user.id}`)}
                            style={{ flex: 1, minWidth: 0, cursor: "pointer" }}
                          >
                            <div style={{ color: "#FFF", fontSize: "15px", fontWeight: 600, marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {user.name}
                            </div>
                            <div style={{ color: "#888", fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              @{user.username}
                            </div>
                          </div>
                          <button
                            onClick={() => handleUnblockUser(user.id)}
                            style={{
                              padding: "8px 16px",
                              backgroundColor: "#E8C96A",
                              color: "#01050D",
                              border: "none",
                              borderRadius: "5px",
                              fontSize: "13px",
                              fontWeight: 600,
                              cursor: "pointer",
                              flexShrink: 0,
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#F5D97A";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#E8C96A";
                            }}
                          >
                            Unblock
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#13192A",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "100%",
              border: "1px solid #1E2A47",
            }}
          >
            <div style={{ color: "#FFF", fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>
              Delete Post
            </div>
            <div style={{ color: "#888", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
              Are you sure you want to delete this post? This action cannot be undone.
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "transparent",
                  color: "#888",
                  border: "1px solid #1E2A47",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#E8C96A";
                  e.currentTarget.style.color = "#E8C96A";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#1E2A47";
                  e.currentTarget.style.color = "#888";
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeletePost}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#EF4444",
                  color: "#FFF",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#DC2626";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#EF4444";
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
