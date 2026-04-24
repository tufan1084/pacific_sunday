"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { IoClose, IoEarthOutline, IoLockClosedOutline, IoSearch, IoSettingsOutline, IoPersonAddOutline, IoNotificationsOutline, IoImageOutline } from "react-icons/io5";
import { api, ApiJoinRequest } from "@/app/services/api";
import { resolveMediaUrl } from "@/app/lib/constants";
import type { Team, TeamMember } from "@/app/types/community";
import { useToast } from "@/app/context/ToastContext";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";

interface TeamMembersSheetProps {
  team: Team;
  onClose: () => void;
  onJoin: (teamId: number) => void;
  onLeave: (teamId: number) => void;
  refreshToken?: number;
  initialView?: "members" | "settings" | "invite" | "requests";
}

export default function TeamMembersSheet({ team, onClose, onJoin, onLeave, refreshToken = 0, initialView = "members" }: TeamMembersSheetProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"members" | "settings" | "invite" | "requests">(initialView);
  const [joinRequests, setJoinRequests] = useState<ApiJoinRequest[]>([]);
  const [processing, setProcessing] = useState<number | null>(null);
  const toast = useToast();
  
  // Settings form
  const [teamName, setTeamName] = useState(team.name);
  const [teamDesc, setTeamDesc] = useState(team.description || "");
  const [teamPrivacy, setTeamPrivacy] = useState<"public" | "private">(team.privacy);
  const [teamImage, setTeamImage] = useState<string | null>(team.imageUrl);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Invite form
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [searching, setSearching] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<Set<number>>(new Set());
  const [confirmAction, setConfirmAction] = useState<{ type: "promote" | "remove" | "delete"; memberId?: number; memberName?: string } | null>(null);

  const isAdmin = team.role === "admin";

  useEffect(() => {
    loadMembers();
    if (isAdmin) loadJoinRequests();
  }, [team.id, refreshToken]);

  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await api.teams.get(team.id);
      if (res.success) {
        const t = (res.data as any)?.team;
        setMembers(t?.members || []);
      }
    } catch (error) {
      console.error("Failed to load members:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadJoinRequests = async () => {
    try {
      const res = await api.teams.getJoinRequests(team.id);
      if (res.success) {
        setJoinRequests((res.data as any)?.requests || []);
      }
    } catch (error) {
      console.error("Failed to load join requests:", error);
    }
  };

  const handlePromote = async (memberId: number) => {
    setProcessing(memberId);
    try {
      const res = await api.teams.promoteMember(team.id, memberId);
      if (res.success) {
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: "admin" } : m));
        toast.success("Member promoted to admin");
      } else {
        toast.error(res.message || "Failed to promote member");
      }
    } catch (error) {
      console.error("Failed to promote:", error);
      toast.error("Failed to promote member");
    } finally {
      setProcessing(null);
      setConfirmAction(null);
    }
  };

  const handleRemove = async (memberId: number) => {
    setProcessing(memberId);
    try {
      const res = await api.teams.removeMember(team.id, memberId);
      if (res.success) {
        setMembers(prev => prev.filter(m => m.id !== memberId));
        toast.success("Member removed from team");
      } else {
        toast.error(res.message || "Failed to remove member");
      }
    } catch (error) {
      console.error("Failed to remove:", error);
      toast.error("Failed to remove member");
    } finally {
      setProcessing(null);
      setConfirmAction(null);
    }
  };

  const handleApproveRequest = async (requestId: number) => {
    setProcessing(requestId);
    try {
      const res = await api.teams.approveJoinRequest(team.id, requestId);
      if (res.success) {
        setJoinRequests(prev => prev.filter(r => r.id !== requestId));
        await loadMembers();
        toast.success("Join request approved");
      } else {
        toast.error(res.message || "Failed to approve");
      }
    } catch (error) {
      console.error("Failed to approve:", error);
      toast.error("Failed to approve request");
    } finally {
      setProcessing(null);
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    setProcessing(requestId);
    try {
      const res = await api.teams.rejectJoinRequest(team.id, requestId);
      if (res.success) {
        setJoinRequests(prev => prev.filter(r => r.id !== requestId));
        toast.success("Join request rejected");
      } else {
        toast.error(res.message || "Failed to reject");
      }
    } catch (error) {
      console.error("Failed to reject:", error);
      toast.error("Failed to reject request");
    } finally {
      setProcessing(null);
    }
  };

  const handlePickImage = () => {
    if (busy || uploadingImage) return;
    fileInputRef.current?.click();
  };

  const handleImageSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Image must be under 10 MB");
      return;
    }
    setUploadingImage(true);
    try {
      const res = await api.teams.uploadImage(file);
      if (res.success && res.data?.imageUrl) {
        setTeamImage(res.data.imageUrl);
      } else {
        toast.error(res.message || "Could not upload image");
      }
    } catch {
      toast.error("Could not upload image");
    } finally {
      setUploadingImage(false);
    }
  };

  const clearTeamImage = () => setTeamImage(null);

  const handleSaveSettings = async () => {
    if (!teamName.trim() || teamName.trim().length < 3) {
      toast.error("Team name must be at least 3 characters");
      return;
    }
    setBusy(true);
    try {
      const res = await api.teams.update(team.id, {
        name: teamName.trim(),
        description: teamDesc.trim() || undefined,
        privacy: teamPrivacy,
        imageUrl: teamImage, // null clears the image, string sets/replaces it
      });
      if (res.success) {
        toast.success("Team updated successfully");
        onClose();
      } else {
        toast.error(res.message || "Failed to update team");
      }
    } catch (error) {
      console.error("Failed to update:", error);
      toast.error("Failed to update team");
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteTeam = async () => {
    setBusy(true);
    try {
      const res = await api.teams.delete(team.id);
      if (res.success) {
        toast.success("Team deleted successfully");
        onClose();
        // Reload page to refresh teams list
        setTimeout(() => window.location.reload(), 500);
      } else {
        toast.error(res.message || "Failed to delete team");
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      toast.error("Failed to delete team");
    } finally {
      setBusy(false);
      setConfirmAction(null);
    }
  };

  const handleSearchUsers = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.teams.searchUsers(query);
      if (res.success) {
        const users = (res.data as any)?.users || [];
        const memberIds = members.map(m => m.id);
        const filteredUsers = users.filter((u: any) => !memberIds.includes(u.id));
        setSearchResults(filteredUsers);
        
        // Check which users have pending invites
        await checkPendingInvites(filteredUsers.map((u: any) => u.id));
      }
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setSearching(false);
    }
  };

  const checkPendingInvites = async (userIds: number[]) => {
    // For now, we'll check by trying to invite and seeing the response
    // A better approach would be a dedicated API endpoint
    // For this implementation, we'll track locally after sending
  };

  const handleSendInvites = async () => {
    if (selectedUsers.length === 0) {
      toast.error("Please select at least one user");
      return;
    }
    setBusy(true);
    try {
      const res = await api.teams.invite(team.id, selectedUsers);
      if (res.success) {
        const inviteCount = (res.data as any)?.inviteCount || 0;
        if (inviteCount > 0) {
          toast.success(`Invited ${inviteCount} user(s)`);
          // Mark these users as having pending invites
          setPendingInvites(prev => new Set([...prev, ...selectedUsers]));
        } else {
          toast.info("Selected users already have pending invites");
        }
        setSelectedUsers([]);
        setSearchQuery("");
        setSearchResults([]);
      } else {
        toast.error(res.message || "Failed to send invites");
      }
    } catch (error) {
      console.error("Failed to invite:", error);
      toast.error("Failed to send invites");
    } finally {
      setBusy(false);
    }
  };

  const filtered = members.filter(m => {
    const needle = q.trim().toLowerCase();
    if (!needle) return true;
    return m.name.toLowerCase().includes(needle) || m.username.toLowerCase().includes(needle);
  });

  const canJoin = team.privacy === "public" && !team.isMember;
  const canLeave = team.isMember && team.role !== "admin";

  const handleJoinLeave = async () => {
    setBusy(true);
    try {
      if (team.isMember) await onLeave(team.id);
      else await onJoin(team.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        backgroundColor: "#13192A",
        borderRadius: "5px",
        padding: "16px",
        fontFamily: "var(--font-poppins), sans-serif",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between" style={{ marginBottom: "12px" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: "15px", color: "#E8C96A", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {view === "members" ? team.name : view === "settings" ? "Team Settings" : view === "invite" ? "Invite Members" : "Join Requests"}
          </div>
          {view === "members" && (
            <div className="flex items-center gap-1" style={{ color: "#888", fontSize: "11px", marginTop: "2px" }}>
              {team.privacy === "public"
                ? <><IoEarthOutline size={11} /><span>Public</span></>
                : <><IoLockClosedOutline size={11} /><span>Private</span></>
              }
              <span>· {team.memberCount} members</span>
            </div>
          )}
        </div>
        <button
          onClick={() => view === "members" ? onClose() : setView("members")}
          style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: "4px" }}
          aria-label="Close"
        >
          <IoClose size={20} />
        </button>
      </div>

      {/* Members View */}
      {view === "members" && (
        <>
          {(canJoin || canLeave) && (
            <button
              onClick={handleJoinLeave}
              disabled={busy}
              style={{
                width: "100%", marginBottom: "12px",
                backgroundColor: canLeave ? "transparent" : "#E8C96A",
                color: canLeave ? "#F87171" : "#060D1F",
                border: canLeave ? "1px solid #F87171" : "none",
                borderRadius: "5px",
                padding: "9px 12px",
                fontSize: "13px", fontWeight: 500,
                cursor: busy ? "not-allowed" : "pointer",
                opacity: busy ? 0.6 : 1,
                fontFamily: "inherit",
              }}
            >
              {canLeave ? "Leave team" : "Join team"}
            </button>
          )}

          <div style={{ position: "relative", marginBottom: "12px" }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search members..."
              style={{
                width: "100%",
                backgroundColor: "#060D1F",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "5px",
                padding: "8px 10px 8px 32px",
                color: "#FFFFFF", fontSize: "12px",
                fontFamily: "inherit",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <IoSearch size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#888" }} />
          </div>

          <div style={{ maxHeight: "360px", overflowY: "auto" }}>
            {loading ? (
              <div style={{ color: "#888", fontSize: "12px", padding: "8px 0" }}>Loading members...</div>
            ) : filtered.length === 0 ? (
              <div style={{ color: "#888", fontSize: "12px", padding: "8px 0" }}>
                {q ? "No matches." : "No members yet."}
              </div>
            ) : filtered.map(m => (
              <div key={m.id} className="flex items-center gap-3" style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div
                  style={{
                    width: "32px", height: "32px", borderRadius: "5px",
                    backgroundColor: "#060D1F", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: "10px", fontWeight: 700,
                    color: "#E8C96A", flexShrink: 0, overflow: "hidden",
                  }}
                >
                  {m.avatarUrl ? (
                    <Image src={m.avatarUrl} alt="" width={32} height={32} style={{ width: "100%", height: "100%", objectFit: "cover" }} unoptimized />
                  ) : (
                    m.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "#E8C96A", fontSize: "13px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>{m.name}</span>
                    {m.role === "admin" && (
                      <span style={{ fontSize: "10px", color: "#060D1F", backgroundColor: "#E8C96A", padding: "1px 6px", borderRadius: "3px", fontWeight: 600 }}>
                        Admin
                      </span>
                    )}
                  </div>
                  <div style={{ color: "#888", fontSize: "11px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    @{m.username}
                  </div>
                </div>
                {isAdmin && m.role !== "admin" && m.id !== team.creatorId && (
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button onClick={() => setConfirmAction({ type: "promote", memberId: m.id, memberName: m.name })} disabled={processing === m.id} style={{ backgroundColor: "#060D1F", border: "1px solid #1E2A47", borderRadius: "4px", padding: "4px 8px", color: "#E8C96A", fontSize: "10px", cursor: "pointer", opacity: processing === m.id ? 0.5 : 1 }}>
                      Promote
                    </button>
                    <button onClick={() => setConfirmAction({ type: "remove", memberId: m.id, memberName: m.name })} disabled={processing === m.id} style={{ backgroundColor: "transparent", border: "1px solid #F87171", borderRadius: "4px", padding: "4px 8px", color: "#F87171", fontSize: "10px", cursor: "pointer", opacity: processing === m.id ? 0.5 : 1 }}>
                      Remove
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Settings View */}
      {view === "settings" && (
        <div>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ color: "#FFF", fontSize: "12px", display: "block", marginBottom: "6px" }}>Team image</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handlePickImage}
                disabled={busy || uploadingImage}
                style={{
                  width: "56px", height: "56px",
                  borderRadius: "8px",
                  backgroundColor: "#060D1F",
                  border: "1px dashed rgba(232,201,106,0.4)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: busy || uploadingImage ? "not-allowed" : "pointer",
                  overflow: "hidden", padding: 0, flexShrink: 0,
                }}
                aria-label="Upload team image"
              >
                {teamImage ? (
                  <Image src={resolveMediaUrl(teamImage)} alt="Team" width={56} height={56} style={{ width: "56px", height: "56px", objectFit: "cover" }} unoptimized />
                ) : uploadingImage ? (
                  <span style={{ fontSize: "10px", color: "#888" }}>Uploading…</span>
                ) : (
                  <IoImageOutline size={20} color="#E8C96A" />
                )}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#94A3B8", fontSize: "11px", lineHeight: 1.5 }}>
                  {teamImage ? "Click the image to replace it." : "JPG / PNG / WebP, up to 10 MB."}
                </div>
                {teamImage && (
                  <button
                    type="button"
                    onClick={clearTeamImage}
                    disabled={busy || uploadingImage}
                    style={{ background: "none", border: "none", color: "#F87171", fontSize: "11px", marginTop: "4px", padding: 0, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Remove image
                  </button>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleImageSelected}
              style={{ display: "none" }}
            />
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ color: "#FFF", fontSize: "12px", display: "block", marginBottom: "6px" }}>Team Name</label>
            <input value={teamName} onChange={(e) => setTeamName(e.target.value)} style={{ width: "100%", backgroundColor: "#060D1F", border: "1px solid #1E2A47", borderRadius: "5px", padding: "8px", color: "#FFF", fontSize: "12px", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: "12px" }}>
            <label style={{ color: "#FFF", fontSize: "12px", display: "block", marginBottom: "6px" }}>Description</label>
            <textarea value={teamDesc} onChange={(e) => setTeamDesc(e.target.value)} rows={3} style={{ width: "100%", backgroundColor: "#060D1F", border: "1px solid #1E2A47", borderRadius: "5px", padding: "8px", color: "#FFF", fontSize: "12px", resize: "vertical", boxSizing: "border-box" }} />
          </div>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ color: "#FFF", fontSize: "12px", display: "block", marginBottom: "6px" }}>Privacy</label>
            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={() => setTeamPrivacy("public")} style={{ flex: 1, backgroundColor: teamPrivacy === "public" ? "#E8C96A" : "#060D1F", color: teamPrivacy === "public" ? "#060D1F" : "#FFF", border: "1px solid #1E2A47", borderRadius: "5px", padding: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                Public
              </button>
              <button onClick={() => setTeamPrivacy("private")} style={{ flex: 1, backgroundColor: teamPrivacy === "private" ? "#E8C96A" : "#060D1F", color: teamPrivacy === "private" ? "#060D1F" : "#FFF", border: "1px solid #1E2A47", borderRadius: "5px", padding: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>
                Private
              </button>
            </div>
          </div>
          <button onClick={handleSaveSettings} disabled={busy} style={{ width: "100%", backgroundColor: "#E8C96A", color: "#060D1F", border: "none", borderRadius: "5px", padding: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer", opacity: busy ? 0.5 : 1, marginBottom: "12px" }}>
            {busy ? "Saving..." : "Save Changes"}
          </button>
          
          {/* Delete Team Button - Only for creator */}
          {team.creatorId === parseInt(localStorage.getItem('ps_user_id') || '0') && (
            <>
              <div style={{ borderTop: "1px solid #1E2A47", marginTop: "16px", paddingTop: "16px" }}>
                <div style={{ color: "#888", fontSize: "11px", marginBottom: "8px" }}>Danger Zone</div>
                <button 
                  onClick={() => setConfirmAction({ type: "delete" })} 
                  disabled={busy}
                  style={{ 
                    width: "100%", 
                    backgroundColor: "transparent", 
                    color: "#F87171", 
                    border: "1px solid #F87171", 
                    borderRadius: "5px", 
                    padding: "10px", 
                    fontSize: "13px", 
                    fontWeight: 600, 
                    cursor: "pointer", 
                    opacity: busy ? 0.5 : 1 
                  }}
                >
                  Delete Team
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Invite View */}
      {view === "invite" && (
        <div>
          <div style={{ position: "relative", marginBottom: "12px" }}>
            <input
              value={searchQuery}
              onChange={(e) => handleSearchUsers(e.target.value)}
              placeholder="Search users to invite..."
              style={{
                width: "100%",
                backgroundColor: "#060D1F",
                border: "1px solid #1E2A47",
                borderRadius: "5px",
                padding: "8px 10px 8px 32px",
                color: "#FFF", fontSize: "12px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
            <IoSearch size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#888" }} />
          </div>
          {selectedUsers.length > 0 && (
            <div style={{ marginBottom: "12px", padding: "8px", backgroundColor: "#060D1F", borderRadius: "5px" }}>
              <div style={{ color: "#E8C96A", fontSize: "11px", marginBottom: "4px" }}>{selectedUsers.length} user(s) selected</div>
              <button onClick={handleSendInvites} disabled={busy} style={{ width: "100%", backgroundColor: "#E8C96A", color: "#060D1F", border: "none", borderRadius: "5px", padding: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: busy ? 0.5 : 1 }}>
                {busy ? "Sending..." : "Send Invites"}
              </button>
            </div>
          )}
          <div style={{ maxHeight: "300px", overflowY: "auto" }}>
            {searching ? (
              <div style={{ color: "#888", fontSize: "12px", padding: "8px 0" }}>Searching...</div>
            ) : searchResults.length === 0 ? (
              <div style={{ color: "#888", fontSize: "12px", padding: "8px 0" }}>
                {searchQuery.trim().length < 2 ? "Type to search users" : "No users found"}
              </div>
            ) : searchResults.map((user: any) => (
              <div key={user.id} className="flex items-center gap-3" style={{ padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "5px", backgroundColor: "#060D1F", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, color: "#E8C96A", flexShrink: 0 }}>
                  {user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: "#E8C96A", fontSize: "13px", fontWeight: 500 }}>{user.name}</div>
                  <div style={{ color: "#888", fontSize: "11px" }}>@{user.username}</div>
                </div>
                <button
                  onClick={() => setSelectedUsers(prev => prev.includes(user.id) ? prev.filter(id => id !== user.id) : [...prev, user.id])}
                  disabled={pendingInvites.has(user.id)}
                  style={{ 
                    backgroundColor: pendingInvites.has(user.id) ? "#888" : selectedUsers.includes(user.id) ? "#E8C96A" : "#060D1F", 
                    color: pendingInvites.has(user.id) ? "#FFF" : selectedUsers.includes(user.id) ? "#060D1F" : "#E8C96A", 
                    border: "1px solid #1E2A47", 
                    borderRadius: "5px", 
                    padding: "6px 12px", 
                    fontSize: "11px", 
                    fontWeight: 600, 
                    cursor: pendingInvites.has(user.id) ? "not-allowed" : "pointer",
                    opacity: pendingInvites.has(user.id) ? 0.6 : 1
                  }}
                >
                  {pendingInvites.has(user.id) ? "Pending" : selectedUsers.includes(user.id) ? "Selected" : "Select"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Join Requests View */}
      {view === "requests" && (
        <div style={{ maxHeight: "360px", overflowY: "auto" }}>
          {joinRequests.length === 0 ? (
            <div style={{ color: "#888", fontSize: "12px", padding: "8px 0" }}>No pending requests</div>
          ) : joinRequests.map((request) => (
            <div key={request.id} style={{ padding: "12px", backgroundColor: "#060D1F", borderRadius: "5px", marginBottom: "8px" }}>
              <div style={{ marginBottom: "8px" }}>
                <div style={{ color: "#E8C96A", fontSize: "13px", fontWeight: 600 }}>{request.name}</div>
                <div style={{ color: "#888", fontSize: "11px" }}>@{request.username}</div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => handleApproveRequest(request.id)} disabled={processing === request.id} style={{ flex: 1, backgroundColor: "#E8C96A", color: "#060D1F", border: "none", borderRadius: "5px", padding: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: processing === request.id ? 0.5 : 1 }}>
                  Approve
                </button>
                <button onClick={() => handleRejectRequest(request.id)} disabled={processing === request.id} style={{ flex: 1, backgroundColor: "transparent", color: "#888", border: "1px solid #1E2A47", borderRadius: "5px", padding: "8px", fontSize: "12px", fontWeight: 600, cursor: "pointer", opacity: processing === request.id ? 0.5 : 1 }}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      {confirmAction && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          title={
            confirmAction.type === "delete" 
              ? "Delete Team" 
              : confirmAction.type === "promote" 
              ? "Promote to Admin" 
              : "Remove Member"
          }
          message={
            confirmAction.type === "delete"
              ? `Are you sure you want to delete "${team.name}"? This will permanently delete the team, all posts, and remove all members. This action cannot be undone.`
              : confirmAction.type === "promote" 
              ? `Are you sure you want to promote ${confirmAction.memberName} to admin? They will have full team management permissions.`
              : `Are you sure you want to remove ${confirmAction.memberName} from the team? This action cannot be undone.`
          }
          confirmText={confirmAction.type === "delete" ? "Delete Team" : confirmAction.type === "promote" ? "Promote" : "Remove"}
          cancelText="Cancel"
          confirmColor={confirmAction.type === "delete" || confirmAction.type === "remove" ? "#F87171" : "#E8C96A"}
          onConfirm={() => {
            if (confirmAction.type === "delete") {
              handleDeleteTeam();
            } else if (confirmAction.type === "promote" && confirmAction.memberId) {
              handlePromote(confirmAction.memberId);
            } else if (confirmAction.type === "remove" && confirmAction.memberId) {
              handleRemove(confirmAction.memberId);
            }
          }}
        />
      )}
    </div>
  );
}
