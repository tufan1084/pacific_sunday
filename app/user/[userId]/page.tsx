"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FiArrowLeft, FiUserPlus, FiUserCheck } from "react-icons/fi";
import { api, ApiUserProfile } from "@/app/services/api";
import { useToast } from "@/app/context/ToastContext";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const toast = useToast();

  const userId = params?.userId ? parseInt(params.userId as string) : null;
  const [profile, setProfile] = useState<ApiUserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!userId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.follows.getUserProfile(userId!);
      if (res.success) {
        setProfile((res.data as any)?.user);
      } else {
        setError(res.message || "User not found");
      }
    } catch {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!profile || profile.isSelf) return;
    setBusy(true);
    try {
      const res = profile.isFollowing
        ? await api.follows.unfollow(profile.id)
        : await api.follows.follow(profile.id);
      if (res.success) {
        setProfile({
          ...profile,
          isFollowing: !profile.isFollowing,
          followerCount: profile.followerCount + (profile.isFollowing ? -1 : 1),
        });
      } else {
        toast.error(res.message || "Failed");
      }
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", color: "#888", textAlign: "center", fontFamily: "var(--font-poppins), sans-serif" }}>
        Loading…
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ padding: "40px", textAlign: "center", fontFamily: "var(--font-poppins), sans-serif" }}>
        <div style={{ color: "#F87171", fontSize: "15px", marginBottom: "12px" }}>{error || "User not found"}</div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "20px", fontFamily: "var(--font-poppins), sans-serif" }}>
      <button
        onClick={() => router.back()}
        style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "none", color: "#888", fontSize: "13px", cursor: "pointer", marginBottom: "20px" }}
      >
        <FiArrowLeft size={14} /> Back
      </button>

      <div style={{ backgroundColor: "#13192A", borderRadius: "8px", padding: "28px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "18px", marginBottom: "24px" }}>
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%",
            backgroundColor: "#060D1F",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#E8C96A", fontSize: "22px", fontWeight: 700,
            flexShrink: 0,
          }}>
            {profile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: "#E8C96A", fontSize: "20px", fontWeight: 500 }}>{profile.name}</div>
            <div style={{ color: "#888", fontSize: "13px" }}>@{profile.username}</div>
            {profile.country && (
              <div style={{ color: "#888", fontSize: "12px", marginTop: "4px" }}>{profile.country}</div>
            )}
          </div>

          {!profile.isSelf && (
            <button
              onClick={handleToggleFollow}
              disabled={busy}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                backgroundColor: profile.isFollowing ? "transparent" : "#E8C96A",
                color: profile.isFollowing ? "#E8C96A" : "#060D1F",
                border: profile.isFollowing ? "1px solid #E8C96A" : "none",
                borderRadius: "5px",
                padding: "10px 18px", fontSize: "13px", fontWeight: 600,
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.6 : 1,
                flexShrink: 0,
              }}
            >
              {profile.isFollowing ? <><FiUserCheck size={14} /> Following</> : <><FiUserPlus size={14} /> Follow</>}
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: "16px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "18px" }}>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ color: "#FFF", fontSize: "18px", fontWeight: 600 }}>{profile.postCount}</div>
            <div style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "3px" }}>Posts</div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ color: "#FFF", fontSize: "18px", fontWeight: 600 }}>{profile.followerCount}</div>
            <div style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "3px" }}>Followers</div>
          </div>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ color: "#FFF", fontSize: "18px", fontWeight: 600 }}>{profile.followingCount}</div>
            <div style={{ color: "#888", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", marginTop: "3px" }}>Following</div>
          </div>
        </div>
      </div>
    </div>
  );
}
