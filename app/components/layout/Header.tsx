"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { NotificationIcon, EditIcon, UserCircleIcon, MenuIcon } from "@/app/components/ui/Icons";
import { api, ApiTeamInvite } from "@/app/services/api";
import { useToast } from "@/app/context/ToastContext";
import { io, Socket } from "socket.io-client";

interface HeaderProps {
  onMenuToggle: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const [invites, setInvites] = useState<ApiTeamInvite[]>([]);
  const [showInvites, setShowInvites] = useState(false);
  const [processing, setProcessing] = useState<number | null>(null);
  const toast = useToast();

  useEffect(() => {
    loadInvites();

    // Get current user ID from localStorage
    const currentUserId = typeof window !== 'undefined' ? parseInt(localStorage.getItem('ps_user_id') || '0') : 0;
    console.log('Current user ID:', currentUserId);

    // Connect to Socket.IO for real-time invite notifications
    const socket: Socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000", {
      transports: ["websocket", "polling"],
    });

    socket.on("team:invite", (data: { teamId: number; userId: number; action: string }) => {
      console.log('Received team:invite event:', data);
      // Only reload invites if this event is for the current user
      if (data.action === "created" && data.userId === currentUserId) {
        console.log('Invite is for current user, reloading invites...');
        loadInvites();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const loadInvites = async () => {
    try {
      console.log('Loading invites...');
      const res = await api.teams.getMyInvites();
      console.log('Invites response:', res);
      if (res.success) {
        const invitesList = (res.data as any)?.invites || [];
        console.log('Setting invites:', invitesList);
        setInvites(invitesList);
      }
    } catch (error) {
      console.error("Failed to load invites:", error);
    }
  };

  const handleAccept = async (inviteId: number) => {
    setProcessing(inviteId);
    try {
      const res = await api.teams.acceptInvite(inviteId);
      if (res.success) {
        setInvites(prev => prev.filter(i => i.id !== inviteId));
        toast.success("Invite accepted! You've joined the team");
        // Reload to refresh teams list
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(res.message || "Failed to accept invite");
      }
    } catch (error) {
      console.error("Failed to accept:", error);
      toast.error("Failed to accept invite");
    } finally {
      setProcessing(null);
    }
  };

  const handleDecline = async (inviteId: number) => {
    setProcessing(inviteId);
    try {
      const res = await api.teams.declineInvite(inviteId);
      if (res.success) {
        setInvites(prev => prev.filter(i => i.id !== inviteId));
        toast.success("Invite declined");
      } else {
        toast.error(res.message || "Failed to decline invite");
      }
    } catch (error) {
      console.error("Failed to decline:", error);
      toast.error("Failed to decline invite");
    } finally {
      setProcessing(null);
    }
  };
  return (
    <header
      className="sticky top-0 z-30 border-b border-ps-border w-full"
      style={{ backgroundColor: "#01050D", fontFamily: "var(--font-poppins), sans-serif" }}
    >
      <div className="flex items-center w-full" style={{ height: "clamp(60px, 8vw, 90px)" }}>

        {/* Logo area */}
        <div
          className="flex items-center flex-shrink-0"
          style={{ width: "clamp(200px, 22vw, 275px)", paddingLeft: "20px" }}
        >
          {/* Hamburger — mobile only */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden mr-3"
            style={{ color: "#E8C96A", background: "none", border: "none", cursor: "pointer", flexShrink: 0 }}
            aria-label="Toggle menu"
          >
            <MenuIcon size={22} />
          </button>

          <div style={{ width: "clamp(120px, 14vw, 220px)", height: "clamp(36px, 5vw, 65px)", position: "relative", flexShrink: 0 }}>
            <Image src="/logo.png" alt="Pacific Sunday" fill style={{ objectFit: "contain", objectPosition: "left center" }} priority />
          </div>
        </div>

        {/* Team info — desktop only */}
        <div
          className="hidden lg:flex items-center gap-3 flex-1"
          style={{ paddingLeft: "20px", fontSize: "clamp(13px, 1.2vw, 18px)", fontWeight: 500 }}
        >
          <span style={{ color: "#E8C96A", fontWeight: 600 }}>Team Canada</span>
          <span style={{ color: "#FFFFFF", fontWeight: 400 }}>TC-2025-006</span>
          <span style={{ color: "#FFFFFF", fontWeight: 400 }}>✓ NFC Verified</span>
        </div>

        {/* Spacer on mobile */}
        <div className="flex-1 lg:hidden" />

        {/* Icons — always visible */}
        <div
          className="flex items-center"
          style={{ gap: "clamp(10px, 1.5vw, 20px)", paddingRight: "clamp(16px, 2vw, 30px)" }}
        >
          <div style={{ position: "relative" }}>
            <button onClick={() => setShowInvites(!showInvites)} style={{ color: "#E8C96A", background: "none", border: "none", cursor: "pointer", display: "flex", position: "relative" }} aria-label="Notifications">
              <NotificationIcon size={24} />
              {invites.length > 0 && (
                <span style={{ position: "absolute", top: "-4px", right: "-4px", backgroundColor: "#F87171", color: "#FFF", fontSize: "10px", fontWeight: 700, borderRadius: "10px", padding: "2px 5px", minWidth: "16px", textAlign: "center" }}>{invites.length}</span>
              )}
            </button>
            {showInvites && invites.length > 0 && (
              <>
                <div onClick={() => setShowInvites(false)} style={{ position: "fixed", inset: 0, zIndex: 40 }} />
                <div style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, backgroundColor: "#13192A", border: "1px solid #1E2A47", borderRadius: "8px", minWidth: "320px", maxWidth: "400px", zIndex: 50, boxShadow: "0 10px 30px rgba(0,0,0,0.5)", maxHeight: "400px", overflowY: "auto" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid #1E2A47" }}>
                    <div style={{ color: "#E8C96A", fontSize: "14px", fontWeight: 600 }}>Team Invitations</div>
                  </div>
                  {invites.map((invite) => (
                    <div key={invite.id} style={{ padding: "12px 16px", borderBottom: "1px solid #1E2A47" }}>
                      <div style={{ marginBottom: "8px" }}>
                        <div style={{ color: "#E8C96A", fontSize: "13px", fontWeight: 600 }}>{invite.teamName}</div>
                        {invite.teamDescription && (
                          <div style={{ color: "#888", fontSize: "11px", marginTop: "2px" }}>{invite.teamDescription}</div>
                        )}
                        <div style={{ color: "#888", fontSize: "11px", marginTop: "4px" }}>
                          {invite.teamPrivacy === "private" ? "🔒 Private" : "🌍 Public"} Team
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button onClick={() => handleAccept(invite.id)} disabled={processing === invite.id} style={{ flex: 1, backgroundColor: "#E8C96A", color: "#060D1F", border: "none", borderRadius: "5px", padding: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: processing === invite.id ? 0.5 : 1 }}>
                          Accept
                        </button>
                        <button onClick={() => handleDecline(invite.id)} disabled={processing === invite.id} style={{ flex: 1, backgroundColor: "transparent", color: "#888", border: "1px solid #1E2A47", borderRadius: "5px", padding: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: processing === invite.id ? 0.5 : 1 }}>
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
          <button style={{ color: "#E8C96A", background: "none", border: "none", cursor: "pointer", display: "flex" }} aria-label="Edit">
            <EditIcon size={24} />
          </button>
          <button style={{ color: "#E8C96A", background: "none", border: "none", cursor: "pointer", display: "flex" }} aria-label="Profile">
            <UserCircleIcon size={24} />
          </button>
        </div>

      </div>
    </header>
  );
}
