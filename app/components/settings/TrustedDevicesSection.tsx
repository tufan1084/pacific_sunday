"use client";

import { useCallback, useEffect, useState } from "react";
import { api, type TrustedDevice } from "@/app/services/api";
import { useToast } from "@/app/context/ToastContext";

/**
 * Lists every device that's been trusted on this account and lets the user
 * revoke one. Revoking forces the next sign-in from that device through the
 * email-OTP gate again — i.e. removes its "skip OTP" privilege without
 * killing the user's current session.
 */
function formatDate(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

export default function TrustedDevicesSection() {
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const { showToast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.auth.listDevices();
      if (res.success && res.data) setDevices(res.data.devices);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRevoke = async (id: number) => {
    setRevokingId(id);
    try {
      const res = await api.auth.revokeDevice(id);
      if (res.success) {
        setDevices((prev) => prev.filter((d) => d.id !== id));
        showToast("Device revoked. It'll need email verification next time.", "success");
      } else {
        showToast(res.message || "Failed to revoke device", "error");
      }
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div style={{ backgroundColor: "#13192A", borderRadius: "8px", padding: "clamp(16px, 2vw, 20px) clamp(20px, 2.5vw, 24px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="2">
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <circle cx="12" cy="17" r="1" />
        </svg>
        <span style={{ color: "#E8C96A", fontSize: "16px", fontWeight: 500 }}>Trusted Devices</span>
      </div>
      <div style={{ height: "1px", backgroundColor: "rgba(255, 255, 255, 0.08)", margin: "0 -24px 12px -24px" }} />

      <p style={{ color: "#94A3B8", fontSize: "13px", marginBottom: "16px", lineHeight: 1.5 }}>
        Sign-ins from these devices skip the email verification step. If you
        don't recognise one, revoke it — your account remains safe behind your
        NFC chip and PIN.
      </p>

      {loading && (
        <p style={{ color: "#64748B", fontSize: "13px" }}>Loading devices…</p>
      )}

      {!loading && devices.length === 0 && (
        <p style={{ color: "#64748B", fontSize: "13px" }}>No trusted devices yet.</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {devices.map((d) => (
          <div key={d.id}
            style={{ display: "flex", alignItems: "center", gap: "12px", backgroundColor: "#0b1326", borderRadius: "6px", padding: "12px" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "rgba(232,201,106,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="2">
                <rect x="4" y="3" width="16" height="18" rx="2" />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#FFFFFF", fontSize: "14px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {d.label || "Unknown device"}
              </div>
              <div style={{ color: "#64748B", fontSize: "11px" }}>
                Last seen {formatDate(d.lastSeenAt)}
                {d.ipAddress ? ` · ${d.ipAddress}` : ""}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRevoke(d.id)}
              disabled={revokingId === d.id}
              style={{
                background: "none",
                border: "1px solid rgba(248,113,113,0.4)",
                color: "#F87171",
                fontSize: "12px",
                padding: "6px 12px",
                borderRadius: "5px",
                cursor: revokingId === d.id ? "not-allowed" : "pointer",
                opacity: revokingId === d.id ? 0.5 : 1,
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              {revokingId === d.id ? "Revoking..." : "Revoke"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
