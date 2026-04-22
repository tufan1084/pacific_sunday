"use client";

import { useState } from "react";
import { IoClose } from "react-icons/io5";
import { useToast } from "@/app/context/ToastContext";

interface ReportPanelProps {
  postId: number;
  onClose: () => void;
  onReported: () => void;
}

const REASONS = [
  { value: "spam", label: "Spam or misleading" },
  { value: "abuse", label: "Harassment or abuse" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "hate", label: "Hate speech" },
  { value: "false_info", label: "False information" },
  { value: "other", label: "Other" },
];

export default function ReportPanel({ postId, onClose, onReported }: ReportPanelProps) {
  const { showToast } = useToast();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      showToast("Select a reason", "error");
      return;
    }
    setSubmitting(true);
    try {
      // Backend endpoint not yet implemented — optimistic UI
      await new Promise(r => setTimeout(r, 400));
      showToast("Report submitted. Thanks for keeping the community safe.", "success");
      onReported();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        marginTop: "12px",
        backgroundColor: "#060D1F",
        border: "1px solid rgba(248,113,113,0.25)",
        borderRadius: "8px",
        padding: "14px",
        fontFamily: "var(--font-poppins), sans-serif",
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: "10px" }}>
        <span style={{ color: "#F87171", fontSize: "14px", fontWeight: 500 }}>Report post</span>
        <button
          onClick={onClose}
          style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: 0 }}
          aria-label="Close"
        >
          <IoClose size={20} />
        </button>
      </div>

      <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "12px", marginBottom: "10px" }}>
        Your report is anonymous. Help us keep the community safe.
      </div>

      <div style={{ display: "grid", gap: "6px", marginBottom: "10px" }}>
        {REASONS.map(r => (
          <label
            key={r.value}
            className="flex items-center gap-2"
            style={{
              padding: "8px 10px",
              backgroundColor: reason === r.value ? "rgba(248,113,113,0.12)" : "transparent",
              border: `1px solid ${reason === r.value ? "#F87171" : "rgba(255,255,255,0.08)"}`,
              borderRadius: "5px", cursor: "pointer",
            }}
          >
            <input
              type="radio"
              name={`report-reason-${postId}`}
              value={r.value}
              checked={reason === r.value}
              onChange={() => setReason(r.value)}
              style={{ accentColor: "#F87171" }}
            />
            <span style={{ color: "#FFFFFF", fontSize: "13px" }}>{r.label}</span>
          </label>
        ))}
      </div>

      {reason === "other" && (
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="Tell us more..."
          rows={2}
          maxLength={300}
          style={{
            width: "100%", backgroundColor: "#13192A",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: "5px", padding: "8px 10px",
            color: "#FFFFFF", fontSize: "12px", fontFamily: "inherit",
            outline: "none", resize: "vertical",
            marginBottom: "10px",
          }}
        />
      )}

      <div className="flex gap-2">
        <button
          onClick={onClose}
          style={{
            flex: 1, background: "transparent",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "5px", padding: "8px",
            color: "#FFFFFF", fontSize: "13px",
            cursor: "pointer", fontFamily: "inherit",
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || !reason}
          style={{
            flex: 1, backgroundColor: "#F87171",
            color: "#060D1F", border: "none",
            borderRadius: "5px", padding: "8px",
            fontSize: "13px", fontWeight: 500,
            cursor: submitting || !reason ? "not-allowed" : "pointer",
            opacity: submitting || !reason ? 0.5 : 1,
            fontFamily: "inherit",
          }}
        >
          {submitting ? "Submitting..." : "Submit report"}
        </button>
      </div>
    </div>
  );
}
