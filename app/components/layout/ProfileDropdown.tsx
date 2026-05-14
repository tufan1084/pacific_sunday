"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { UserCircleIcon } from "@/app/components/ui/Icons";
import { useAuth } from "@/app/context/AuthContext";
import { FiUser, FiSettings, FiLogOut, FiTrendingUp, FiUsers, FiBookmark } from "react-icons/fi";
import LogoutModal from "@/app/components/ui/LogoutModal";

export default function ProfileDropdown() {
  const [open, setOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const handle = (e: Event) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, []);

  const handleLogout = () => {
    logout();
    setOpen(false);
    setShowLogoutModal(false);
    router.push("/login");
  };

  const handleCommunityProfile = () => {
    setOpen(false);
    router.push("/community-profile");
  };

  const handleProfile = () => {
    setOpen(false);
    router.push("/profile");
  };

  const handlePointsHistory = () => {
    setOpen(false);
    router.push("/points-history");
  };

  const handleSavedPosts = () => {
    setOpen(false);
    router.push("/community?tab=Saved");
  };

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="profile-button"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          padding: 0,
          position: "relative",
          WebkitTapHighlightColor: "transparent",
        }}
        aria-label="Profile"
        aria-expanded={open}
      >
        {user?.photoUrl ? (
          <div className="profile-avatar" style={{
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            overflow: "hidden",
            border: "2px solid #E8C96A",
            position: "relative",
            backgroundColor: "#1a1f2e"
          }}>
            <Image
              src={user.photoUrl}
              alt={user.name || "Profile"}
              fill
              style={{ objectFit: "cover" }}
              unoptimized
            />
          </div>
        ) : (
          <div className="profile-avatar" style={{
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            backgroundColor: "#E8C96A",
            border: "2px solid #E8C96A",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 600,
            fontSize: "16px",
            color: "#01050D",
            textTransform: "uppercase"
          }}>
            {user?.name?.charAt(0) || "U"}
          </div>
        )}
        {showTooltip && (
          <span className="profile-tooltip" style={{
            position: "absolute",
            bottom: "-32px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#1E2A47",
            color: "#FFF",
            fontSize: "12px",
            padding: "6px 10px",
            borderRadius: "6px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 100
          }}>
            Profile
          </span>
        )}
      </button>


      {open && (
        <div style={{
          position: "fixed",
          top: "calc(clamp(50px, 6vw, 70px) + 8px)",
          right: "12px",
          width: "240px",
          backgroundColor: "#13192A",
          border: "1px solid #1E2A47",
          borderRadius: "8px",
          zIndex: 50,
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          fontFamily: "var(--font-poppins), sans-serif",
        }}>
          {/* User Info */}
          <button
            onClick={() => { setOpen(false); router.push("/profile"); }}
            style={{
              width: "100%",
              padding: "16px",
              borderBottom: "1px solid #1E2A47",
              display: "flex",
              alignItems: "center",
              gap: "12px",
              background: "none",
              border: "none",
              cursor: "pointer",
              textAlign: "left",
              transition: "background-color 0.2s"
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(232,201,106,0.05)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            {user?.photoUrl ? (
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "8px",
                overflow: "hidden",
                border: "2px solid #E8C96A",
                position: "relative",
                flexShrink: 0
              }}>
                <Image
                  src={user.photoUrl}
                  alt={user.name || "Profile"}
                  fill
                  style={{ objectFit: "cover" }}
                  unoptimized
                />
              </div>
            ) : (
              <div style={{
                width: "48px",
                height: "48px",
                borderRadius: "8px",
                backgroundColor: "#E8C96A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 600,
                fontSize: "20px",
                color: "#01050D",
                textTransform: "uppercase",
                flexShrink: 0
              }}>
                {user?.name?.charAt(0) || "U"}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: "#FFF",
                fontSize: "14px",
                fontWeight: 600,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}>
                {user?.name || "User"}
              </div>
              <div style={{
                color: "#888",
                fontSize: "12px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}>
                @{user?.username || "username"}
              </div>
            </div>
          </button>

          {/* Menu Items */}
          <div style={{ padding: "8px 0" }}>
            <button
              onClick={handleProfile}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
                color: "#FFF",
                fontSize: "14px",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(232,201,106,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <FiUser size={18} color="#E8C96A" />
              <span>View Profile</span>
            </button>

            <button
              onClick={handleCommunityProfile}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
                color: "#FFF",
                fontSize: "14px",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(232,201,106,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <FiUsers size={18} color="#E8C96A" />
              <span>Community Profile</span>
            </button>

            <button
              onClick={handleSavedPosts}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
                color: "#FFF",
                fontSize: "14px",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(232,201,106,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <FiBookmark size={18} color="#E8C96A" />
              <span>Saved Posts</span>
            </button>

            <button
              onClick={handlePointsHistory}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
                color: "#FFF",
                fontSize: "14px",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(232,201,106,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <FiTrendingUp size={18} color="#E8C96A" />
              <span>Points History</span>
            </button>

            <button
              onClick={() => { setOpen(false); setShowLogoutModal(true); }}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                cursor: "pointer",
                color: "#FFF",
                fontSize: "14px",
                transition: "background-color 0.2s"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(232,201,106,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <FiLogOut size={18} color="#E8C96A" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}

      {showLogoutModal && (
        <LogoutModal
          onConfirm={handleLogout}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </div>
  );
}
