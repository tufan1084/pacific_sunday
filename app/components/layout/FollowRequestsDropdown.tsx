"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiUserPlus, FiCheck, FiX } from "react-icons/fi";
import { api, ApiFollowRequest } from "@/app/services/api";
import { useToast } from "@/app/context/ToastContext";
import Image from "next/image";
import { resolveMediaUrl } from "@/app/lib/constants";

export default function FollowRequestsDropdown() {
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState<ApiFollowRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const handle = (e: Event) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, []);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await api.follows.getFollowRequests();
      if (res.success && res.data) {
        setRequests(res.data.requests);
      }
    } catch (error) {
      console.error("Failed to load follow requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      await loadRequests();
    }
  };

  const handleAccept = async (requestId: number) => {
    setProcessing(requestId);
    try {
      const res = await api.follows.acceptFollowRequest(requestId);
      if (res.success) {
        toast.success("Request accepted");
        setRequests(prev => prev.filter(r => r.id !== requestId));
      } else {
        toast.error(res.message || "Failed to accept");
      }
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (requestId: number) => {
    setProcessing(requestId);
    try {
      const res = await api.follows.rejectFollowRequest(requestId);
      if (res.success) {
        toast.success("Request rejected");
        setRequests(prev => prev.filter(r => r.id !== requestId));
      } else {
        toast.error(res.message || "Failed to reject");
      }
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={handleOpen}
        style={{
          color: "#E8C96A",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          padding: "6px",
          borderRadius: "6px",
          WebkitTapHighlightColor: "transparent",
        }}
        aria-label="Follow Requests"
        aria-expanded={open}
      >
        <FiUserPlus size={24} />
        {requests.length > 0 && (
          <span style={{
            position: "absolute",
            top: "0px",
            right: "0px",
            backgroundColor: "#E8C96A",
            color: "#01050D",
            fontSize: "10px",
            fontWeight: 700,
            borderRadius: "10px",
            padding: "2px 5px",
            minWidth: "16px",
            textAlign: "center",
            pointerEvents: "none"
          }}>
            {requests.length > 99 ? "99+" : requests.length}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "fixed",
          top: "calc(clamp(50px, 6vw, 70px) + 8px)",
          right: "12px",
          width: "320px",
          maxHeight: "calc(100vh - clamp(50px, 6vw, 70px) - 24px)",
          overflowY: "auto",
          backgroundColor: "#13192A",
          border: "1px solid #1E2A47",
          borderRadius: "8px",
          zIndex: 50,
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          fontFamily: "var(--font-poppins), sans-serif",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid #1E2A47",
            position: "sticky",
            top: 0,
            backgroundColor: "#13192A"
          }}>
            <div style={{ color: "#E8C96A", fontSize: "14px", fontWeight: 600 }}>Follow Requests</div>
          </div>

          {loading && requests.length === 0 && (
            <div style={{ padding: "20px", color: "#888", fontSize: "12px", textAlign: "center" }}>
              Loading…
            </div>
          )}

          {!loading && requests.length === 0 && (
            <div style={{ padding: "28px 16px", color: "#888", fontSize: "12px", textAlign: "center" }}>
              No pending requests
            </div>
          )}

          {requests.map((req) => (
            <div
              key={req.id}
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                onClick={() => {
                  setOpen(false);
                  router.push(`/user/${req.senderId}`);
                }}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
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
                {req.photoUrl ? (
                  <Image
                    src={resolveMediaUrl(req.photoUrl)}
                    alt={req.name}
                    width={40}
                    height={40}
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    unoptimized
                  />
                ) : (
                  req.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                )}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  onClick={() => {
                    setOpen(false);
                    router.push(`/user/${req.senderId}`);
                  }}
                  style={{ color: "#FFF", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
                >
                  {req.name}
                </div>
                <div style={{ color: "#888", fontSize: "11px" }}>@{req.username}</div>
              </div>

              <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                <button
                  onClick={() => handleAccept(req.id)}
                  disabled={processing === req.id}
                  style={{
                    backgroundColor: "#E8C96A",
                    color: "#01050D",
                    border: "none",
                    borderRadius: "5px",
                    padding: "6px 10px",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: processing === req.id ? "not-allowed" : "pointer",
                    opacity: processing === req.id ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <FiCheck size={12} /> Accept
                </button>
                <button
                  onClick={() => handleReject(req.id)}
                  disabled={processing === req.id}
                  style={{
                    backgroundColor: "transparent",
                    color: "#888",
                    border: "1px solid #1E2A47",
                    borderRadius: "5px",
                    padding: "6px 10px",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: processing === req.id ? "not-allowed" : "pointer",
                    opacity: processing === req.id ? 0.6 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <FiX size={12} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
