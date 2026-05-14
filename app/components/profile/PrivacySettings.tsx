"use client";

import { useState, useEffect } from "react";
import { FiLock, FiUnlock } from "react-icons/fi";
import { api } from "@/app/services/api";
import { useToast } from "@/app/context/ToastContext";
import { useAuth } from "@/app/context/AuthContext";

export default function PrivacySettings() {
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadPrivacy();
  }, []);

  const loadPrivacy = async () => {
    setLoading(true);
    try {
      const res = await api.profile.get();
      if (res.success && res.data) {
        // Assuming user object has isPrivate field
        setIsPrivate((res.data as any).user?.isPrivate || false);
      }
    } catch (error) {
      console.error("Failed to load privacy settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    setSaving(true);
    try {
      const newValue = !isPrivate;
      const res = await api.profile.updatePrivacy(newValue);
      if (res.success) {
        setIsPrivate(newValue);
        toast.success(`Profile is now ${newValue ? "private" : "public"}`);
      } else {
        toast.error(res.message || "Failed to update privacy");
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", color: "#888", fontSize: "13px" }}>
        Loading privacy settings...
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: "#13192A",
      borderRadius: "8px",
      padding: "24px",
      fontFamily: "var(--font-poppins), sans-serif",
    }}>
      <div style={{ marginBottom: "20px" }}>
        <div style={{ color: "#E8C96A", fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>
          Profile Privacy
        </div>
        <div style={{ color: "#888", fontSize: "13px", lineHeight: "1.5" }}>
          Control who can see your posts and profile information
        </div>
      </div>

      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "16px",
        backgroundColor: "#060D1F",
        borderRadius: "8px",
        border: "1px solid #1E2A47",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {isPrivate ? (
            <FiLock size={20} style={{ color: "#E8C96A" }} />
          ) : (
            <FiUnlock size={20} style={{ color: "#888" }} />
          )}
          <div>
            <div style={{ color: "#FFF", fontSize: "14px", fontWeight: 500 }}>
              {isPrivate ? "Private Account" : "Public Account"}
            </div>
            <div style={{ color: "#888", fontSize: "12px", marginTop: "2px" }}>
              {isPrivate 
                ? "Only approved followers can see your posts" 
                : "Anyone can see your posts and profile"}
            </div>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={saving}
          style={{
            position: "relative",
            width: "48px",
            height: "26px",
            backgroundColor: isPrivate ? "#E8C96A" : "#1E2A47",
            borderRadius: "13px",
            border: "none",
            cursor: saving ? "not-allowed" : "pointer",
            transition: "background-color 0.2s",
            opacity: saving ? 0.6 : 1,
          }}
        >
          <div style={{
            position: "absolute",
            top: "3px",
            left: isPrivate ? "25px" : "3px",
            width: "20px",
            height: "20px",
            backgroundColor: "#FFF",
            borderRadius: "50%",
            transition: "left 0.2s",
          }} />
        </button>
      </div>

      {isPrivate && (
        <div style={{
          marginTop: "16px",
          padding: "12px 16px",
          backgroundColor: "rgba(232, 201, 106, 0.1)",
          border: "1px solid rgba(232, 201, 106, 0.3)",
          borderRadius: "6px",
        }}>
          <div style={{ color: "#E8C96A", fontSize: "12px", lineHeight: "1.5" }}>
            <strong>Private Account:</strong> When your account is private, only people you approve can follow you and see your posts. 
            You'll receive follow requests that you can accept or reject.
          </div>
        </div>
      )}
    </div>
  );
}
