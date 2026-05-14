"use client";

import { useState, useRef, useEffect } from "react";
import { api } from "@/app/services/api";
import { resolveMediaUrl } from "@/app/lib/constants";
import { getData } from "country-list";
import { useToast } from "@/app/context/ToastContext";
import { useAuth } from "@/app/context/AuthContext";
import { FiEdit2, FiUser, FiCamera } from "react-icons/fi";

const inputStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "#0e1420",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: "8px",
  color: "#FFFFFF",
  fontFamily: "var(--font-poppins), sans-serif",
  fontSize: "14px",
  fontWeight: 400,
  outline: "none",
  padding: "10px 12px",
  transition: "border-color 0.2s",
};

const labelStyle: React.CSSProperties = {
  color: "rgba(255,255,255,0.45)",
  fontSize: "11px",
  fontWeight: 500,
  fontFamily: "var(--font-poppins), sans-serif",
  marginBottom: "4px",
  display: "block",
  textTransform: "uppercase",
  letterSpacing: "0.6px",
};

const emptyText: React.CSSProperties = {
  color: "rgba(255,255,255,0.2)",
  fontStyle: "italic",
  fontSize: "14px",
};

interface GolfPassportProps {
  profileData?: any;
  onUpdate?: () => void;
}

const emptyForm = {
  fullName: "", nickname: "", handicap: "", bestScore: "",
  yearsPlaying: "", homeCourse: "", golfCountry: "", bio: "",
};

export default function GolfPassport({ profileData, onUpdate }: GolfPassportProps) {
  const { showToast } = useToast();
  const { refreshUser } = useAuth();
  const [form, setForm] = useState({ ...emptyForm });
  const [savedForm, setSavedForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraError, setCameraError] = useState("");

  const isMobile = typeof window !== "undefined" && /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  const openCamera = async () => {
    setShowPhotoSheet(false);
    if (isMobile) {
      setTimeout(() => cameraRef.current?.click(), 50);
      return;
    }
    // Desktop: use getUserMedia
    setCameraError("");
    setShowCameraModal(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch {
      setCameraError("Camera access denied or not available.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "camera-photo.jpg", { type: "image/jpeg" });
      setPhotoPreview(URL.createObjectURL(file));
      setPendingPhotoFile(file);
      closeCamera();
    }, "image/jpeg", 0.92);
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setShowCameraModal(false);
    setCameraError("");
  };
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [savedPhotoPreview, setSavedPhotoPreview] = useState<string | null>(null);
  const [pendingPhotoFile, setPendingPhotoFile] = useState<File | null>(null);
  const countries = getData();

  // isDirty: true if form changed from saved state OR new photo picked
  const isDirty = pendingPhotoFile !== null ||
    (Object.keys(form) as (keyof typeof form)[]).some(k => form[k] !== savedForm[k]);

  const update = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  const handleNumericInput = (key: string, val: string, maxLength?: number) => {
    let v = val.replace(/[^0-9]/g, "");
    if (maxLength) v = v.slice(0, maxLength);
    setForm(p => ({ ...p, [key]: v }));
  };

  const handleScoreInput = (val: string) => {
    const hasSign = /^[+-]/.test(val);
    const sign = hasSign ? val[0] : "";
    const digits = val.replace(/[^0-9]/g, "").slice(0, 3);
    setForm(p => ({ ...p, bestScore: sign + digits }));
  };

  const handleTextInput = (key: string, val: string) => {
    setForm(p => ({ ...p, [key]: val.replace(/[^a-zA-Z\s]/g, "") }));
  };

  const handleDecimalInput = (key: string, val: string) => {
    setForm(p => ({ ...p, [key]: val.replace(/[^0-9.+-]/g, "") }));
  };

  useEffect(() => {
    const gp = profileData?.golfPassport;
    const populated = gp ? {
      fullName: gp.fullName || profileData?.user?.name || "",
      nickname: gp.nickname || "",
      handicap: gp.handicap || "",
      bestScore: gp.bestScore || "",
      yearsPlaying: gp.yearsPlaying || "",
      homeCourse: gp.homeCourse || "",
      golfCountry: gp.golfCountry || profileData?.user?.country || "",
      bio: gp.bio || "",
    } : {
      ...emptyForm,
      fullName: profileData?.user?.name || "",
      golfCountry: profileData?.user?.country || "",
    };
    setForm(populated);
    setSavedForm(populated);
    if (gp?.photoUrl) {
      setPhoto(gp.photoUrl);
      const resolved = resolveMediaUrl(gp.photoUrl);
      setPhotoPreview(resolved);
      setSavedPhotoPreview(resolved);
    }
  }, [profileData]);

  const handleCancel = () => {
    setForm(savedForm);
    setPhotoPreview(savedPhotoPreview);
    setPendingPhotoFile(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!isDirty) return;
    setSaving(true);
    try {
      let photoUrl = photo;
      if (pendingPhotoFile) {
        const upRes = await api.profile.uploadPhoto(pendingPhotoFile);
        if (!upRes.success || !upRes.data?.photoUrl) {
          showToast(upRes.message || "Failed to upload photo", "error");
          setSaving(false);
          return;
        }
        photoUrl = upRes.data.photoUrl;
        setPhoto(photoUrl);
        const resolved = resolveMediaUrl(photoUrl!);
        setPhotoPreview(resolved);
        setSavedPhotoPreview(resolved);
        setPendingPhotoFile(null);
      }
      const response = await api.profile.updateGolfPassport({ ...form, photoUrl });
      if (response.success) {
        showToast("Golf Passport saved successfully", "success");
        setSavedForm({ ...form });
        setSavedPhotoPreview(photoPreview);
        setIsEditing(false);
        await refreshUser();
        if (onUpdate) onUpdate();
      } else {
        showToast(response.message || "Failed to save Golf Passport", "error");
      }
    } catch {
      showToast("Error saving Golf Passport", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoPreview(URL.createObjectURL(file));
    setPendingPhotoFile(file);
  };

  // ── Info row with icon for view mode ──────────────────────────
  const InfoRow = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
    <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "11px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ width: "30px", height: "30px", borderRadius: "7px", backgroundColor: "rgba(232,201,106,0.07)", border: "1px solid rgba(232,201,106,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: "rgba(255,255,255,0.38)", fontSize: "10px", fontFamily: "var(--font-poppins), sans-serif", textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: "2px" }}>{label}</div>
        {value
          ? <div style={{ color: "#e2e8f0", fontSize: "13.5px", fontFamily: "var(--font-poppins), sans-serif", wordBreak: "break-word", lineHeight: 1.5 }}>{value}</div>
          : <div style={{ color: "rgba(255,255,255,0.18)", fontSize: "13px", fontFamily: "var(--font-poppins), sans-serif" }}>Not set</div>
        }
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: "#13192A", borderRadius: "10px", fontFamily: "var(--font-poppins), sans-serif", overflow: "hidden" }}>

      {/* ── Header ── */}
      <div style={{ padding: "18px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "8px", backgroundColor: "rgba(232,201,106,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 20h20M6 20V10l6-6 6 6v10M10 20v-5h4v5" />
            </svg>
          </div>
          <span style={{ color: "#E8C96A", fontSize: "clamp(15px, 1.8vw, 17px)", fontWeight: 600 }}>Golf Passport</span>
        </div>

        {/* Desktop buttons */}
        <div className="hidden sm:flex" style={{ gap: "8px" }}>
          {isEditing ? (
            <>
              <button onClick={handleCancel} style={{ backgroundColor: "transparent", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "7px", padding: "7px 16px", fontSize: "13px", fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !isDirty}
                style={{ backgroundColor: isDirty ? "#E8C96A" : "rgba(232,201,106,0.25)", color: isDirty ? "#060D1F" : "rgba(6,13,31,0.5)", border: "none", borderRadius: "7px", padding: "7px 20px", fontSize: "13px", fontWeight: 600, fontFamily: "inherit", cursor: (saving || !isDirty) ? "not-allowed" : "pointer", transition: "all 0.2s" }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <button onClick={() => setIsEditing(true)} style={{ backgroundColor: "rgba(232,201,106,0.1)", color: "#E8C96A", border: "1px solid rgba(232,201,106,0.25)", borderRadius: "7px", padding: "7px 16px", fontSize: "13px", fontWeight: 500, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
              <FiEdit2 size={13} /> Edit
            </button>
          )}
        </div>
      </div>

      <div style={{ padding: "20px" }}>

        {/* ══ VIEW MODE ══════════════════════════════════════════ */}
        {!isEditing && (
          <>
            {/* Photo + Name + Nickname hero */}
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "20px" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "10px", overflow: "hidden", border: "2px solid rgba(232,201,106,0.35)", flexShrink: 0, backgroundColor: "#0b1120", display: "flex", alignItems: "center", justifyContent: "center" }}>
                {photoPreview
                  ? <img src={photoPreview} alt="Profile" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : <FiUser size={26} color="rgba(255,255,255,0.15)" />
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "#ffffff", fontSize: "17px", fontWeight: 600, fontFamily: "var(--font-poppins), sans-serif", marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {form.fullName || <span style={{ color: "rgba(255,255,255,0.2)", fontWeight: 400, fontSize: "15px" }}>No name set</span>}
                </div>
                {form.nickname
                  ? <div style={{ color: "#E8C96A", fontSize: "12.5px", fontFamily: "var(--font-poppins), sans-serif" }}>{`"${form.nickname}"`}</div>
                  : <div style={{ color: "rgba(255,255,255,0.2)", fontSize: "12px", fontFamily: "var(--font-poppins), sans-serif" }}>No nickname</div>
                }
              </div>
            </div>

            {/* 3 stat chips */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "8px", marginBottom: "20px" }}>
              {[
                { label: "Handicap", value: form.handicap || "—" },
                { label: "Best Score", value: form.bestScore || "—" },
                { label: "Yrs Playing", value: form.yearsPlaying ? `${form.yearsPlaying}` : "—" },
              ].map(({ label, value }) => (
                <div key={label} style={{ background: "linear-gradient(135deg, rgba(232,201,106,0.06) 0%, rgba(232,201,106,0.02) 100%)", border: "1px solid rgba(232,201,106,0.14)", borderRadius: "10px", padding: "12px 8px", textAlign: "center" }}>
                  <div style={{ color: value !== "—" ? "#E8C96A" : "rgba(255,255,255,0.2)", fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-poppins), sans-serif", lineHeight: 1, marginBottom: "5px" }}>{value}</div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: "10px", fontFamily: "var(--font-poppins), sans-serif", textTransform: "uppercase", letterSpacing: "0.6px" }}>{label}</div>
                </div>
              ))}
            </div>

            {/* Info rows */}
            <InfoRow
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
              label="Home Course" value={form.homeCourse}
            />
            <InfoRow
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>}
              label="Country" value={form.golfCountry}
            />
            <InfoRow
              icon={<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>}
              label="Bio" value={form.bio}
            />

            {/* Mobile edit button */}
            <div className="flex sm:hidden" style={{ marginTop: "18px" }}>
              <button onClick={() => setIsEditing(true)} style={{ flex: 1, backgroundColor: "rgba(232,201,106,0.08)", color: "#E8C96A", border: "1px solid rgba(232,201,106,0.2)", borderRadius: "8px", padding: "11px", fontSize: "14px", fontWeight: 500, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <FiEdit2 size={14} /> Edit Passport
              </button>
            </div>
          </>
        )}

        {/* ══ EDIT MODE ══════════════════════════════════════════ */}
        {isEditing && (
          <>
            {/* Photo upload */}
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Profile Photo</label>
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ width: "64px", height: "64px", borderRadius: "10px", overflow: "hidden", border: "2px solid rgba(232,201,106,0.3)", flexShrink: 0, backgroundColor: "#0e1420", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {photoPreview
                    ? <img src={photoPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <FiUser size={24} color="rgba(255,255,255,0.2)" />
                  }
                </div>
                <button type="button" onClick={() => setShowPhotoSheet(true)} style={{ backgroundColor: "rgba(232,201,106,0.08)", color: "#E8C96A", border: "1px solid rgba(232,201,106,0.2)", borderRadius: "8px", padding: "8px 16px", fontSize: "13px", fontWeight: 500, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                  <FiCamera size={14} /> {photoPreview ? "Change Photo" : "Upload Photo"}
                </button>
                {/* Gallery input */}
                <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFileChange} />
                {/* Camera input */}
                <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={handleFileChange} />

                {/* Photo source sheet */}
                {showPhotoSheet && (
                  <div onClick={() => setShowPhotoSheet(false)} style={{ position: "fixed", inset: 0, zIndex: 9999, backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
                    <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: "420px", backgroundColor: "#13192A", borderRadius: "14px", padding: "8px", fontFamily: "var(--font-poppins), sans-serif" }}>
                      <button
                        onClick={openCamera}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", background: "none", border: "none", borderRadius: "10px", color: "#fff", fontSize: "15px", cursor: "pointer", fontFamily: "inherit" }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                      >
                        <FiCamera size={20} color="#E8C96A" />
                        Take Photo
                      </button>
                      <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.07)", margin: "0 16px" }} />
                      <button
                        onClick={() => { setShowPhotoSheet(false); setTimeout(() => fileRef.current?.click(), 50); }}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: "14px", padding: "14px 16px", background: "none", border: "none", borderRadius: "10px", color: "#fff", fontSize: "15px", cursor: "pointer", fontFamily: "inherit" }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                        Choose from Gallery
                      </button>
                      <div style={{ height: "1px", backgroundColor: "rgba(255,255,255,0.07)", margin: "0 16px" }} />
                      <button
                        onClick={() => setShowPhotoSheet(false)}
                        style={{ width: "100%", padding: "14px 16px", background: "none", border: "none", borderRadius: "10px", color: "#94A3B8", fontSize: "15px", cursor: "pointer", fontFamily: "inherit" }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Full Name + Nickname */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ marginBottom: "14px" }}>
              <div>
                <label style={labelStyle}>Full Name</label>
                <input type="text" style={inputStyle} value={form.fullName} onChange={e => handleTextInput("fullName", e.target.value)} placeholder="e.g., John Doe"
                  onFocus={e => e.currentTarget.style.borderColor = "rgba(232,201,106,0.5)"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
              </div>
              <div>
                <label style={labelStyle}>Nickname</label>
                <input type="text" style={inputStyle} value={form.nickname} onChange={e => handleTextInput("nickname", e.target.value)} placeholder="e.g., Johnny"
                  onFocus={e => e.currentTarget.style.borderColor = "rgba(232,201,106,0.5)"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
              </div>
            </div>

            {/* Handicap + Best Score + Years Playing */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ marginBottom: "14px" }}>
              <div>
                <label style={labelStyle}>Handicap</label>
                <input type="text" inputMode="decimal" style={inputStyle} value={form.handicap} onChange={e => handleDecimalInput("handicap", e.target.value)} placeholder="e.g., 12 or +2"
                  onFocus={e => e.currentTarget.style.borderColor = "rgba(232,201,106,0.5)"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
              </div>
              <div>
                <label style={labelStyle}>Best Score Ever</label>
                <input type="text" inputMode="numeric" style={inputStyle} value={form.bestScore} onChange={e => handleScoreInput(e.target.value)} placeholder="e.g., 72" maxLength={4}
                  onFocus={e => e.currentTarget.style.borderColor = "rgba(232,201,106,0.5)"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
              </div>
              <div>
                <label style={labelStyle}>Years Playing</label>
                <input type="text" inputMode="numeric" style={inputStyle} value={form.yearsPlaying} onChange={e => handleNumericInput("yearsPlaying", e.target.value, 2)} placeholder="e.g., 5" maxLength={2}
                  onFocus={e => e.currentTarget.style.borderColor = "rgba(232,201,106,0.5)"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
              </div>
            </div>

            {/* Home Course + Country */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ marginBottom: "14px" }}>
              <div>
                <label style={labelStyle}>Home Golf Course</label>
                <input style={inputStyle} value={form.homeCourse} onChange={e => update("homeCourse", e.target.value)} placeholder="e.g., Augusta National"
                  onFocus={e => e.currentTarget.style.borderColor = "rgba(232,201,106,0.5)"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
              </div>
              <div>
                <label style={labelStyle}>Country</label>
                <select style={{ ...inputStyle, cursor: "pointer" }} value={form.golfCountry} onChange={e => update("golfCountry", e.target.value)}
                  onFocus={e => e.currentTarget.style.borderColor = "rgba(232,201,106,0.5)"}
                  onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}>
                  <option value="">Select Country</option>
                  {countries.map(c => <option key={c.code} value={c.name}>{c.name}</option>)}
                </select>
              </div>
            </div>

            {/* Bio */}
            <div style={{ marginBottom: "20px" }}>
              <label style={labelStyle}>Bio</label>
              <textarea style={{ ...inputStyle, resize: "none", lineHeight: "1.6" }} rows={3} value={form.bio} onChange={e => update("bio", e.target.value)} placeholder="Tell us about your golf journey..."
                onFocus={e => e.currentTarget.style.borderColor = "rgba(232,201,106,0.5)"}
                onBlur={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"} />
            </div>

            {/* Mobile buttons */}
            <div className="flex sm:hidden" style={{ gap: "10px" }}>
              <button onClick={handleCancel} style={{ flex: 1, backgroundColor: "transparent", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "11px", fontSize: "14px", fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !isDirty}
                style={{ flex: 1, backgroundColor: isDirty ? "#E8C96A" : "rgba(232,201,106,0.2)", color: isDirty ? "#060D1F" : "rgba(6,13,31,0.4)", border: "none", borderRadius: "8px", padding: "11px", fontSize: "14px", fontWeight: 600, fontFamily: "inherit", cursor: (saving || !isDirty) ? "not-allowed" : "pointer", transition: "all 0.2s" }}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ── Desktop camera modal ── */}
      {showCameraModal && (
        <div onClick={closeCamera} style={{ position: "fixed", inset: 0, zIndex: 9999, backgroundColor: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
          <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: "480px", backgroundColor: "#13192A", borderRadius: "14px", overflow: "hidden", fontFamily: "var(--font-poppins), sans-serif" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ color: "#E8C96A", fontWeight: 600, fontSize: "15px" }}>Take Photo</span>
              <button onClick={closeCamera} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: "22px", lineHeight: 1, padding: "0 4px" }}>×</button>
            </div>
            <div style={{ position: "relative", backgroundColor: "#000", aspectRatio: "4/3" }}>
              {cameraError ? (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#F87171", fontSize: "14px", padding: "20px", textAlign: "center" }}>{cameraError}</div>
              ) : (
                <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              )}
              <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>
            <div style={{ padding: "16px 20px", display: "flex", gap: "10px" }}>
              <button onClick={closeCamera} style={{ flex: 1, backgroundColor: "transparent", color: "#94A3B8", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "8px", padding: "11px", fontSize: "14px", fontWeight: 500, fontFamily: "inherit", cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={capturePhoto} disabled={!!cameraError} style={{ flex: 1, backgroundColor: cameraError ? "rgba(232,201,106,0.2)" : "#E8C96A", color: "#060D1F", border: "none", borderRadius: "8px", padding: "11px", fontSize: "14px", fontWeight: 600, fontFamily: "inherit", cursor: cameraError ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <FiCamera size={16} /> Capture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
