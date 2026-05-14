"use client";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  confirmColor?: string;
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  confirmColor = "#E8C96A",
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "16px" }}>
      <div style={{ backgroundColor: "#13192A", borderRadius: "8px", padding: "20px", width: "100%", maxWidth: "400px", fontFamily: "var(--font-poppins), sans-serif" }}>
        <h3 style={{ color: "#E8C96A", fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>{title}</h3>
        <p style={{ color: "#FFF", fontSize: "14px", lineHeight: "1.5", marginBottom: "20px" }}>{message}</p>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={onClose}
            style={{ flex: 1, backgroundColor: "transparent", color: "#888", border: "1px solid #1E2A47", borderRadius: "5px", padding: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            style={{ flex: 1, backgroundColor: confirmColor, color: "#060D1F", border: "none", borderRadius: "5px", padding: "10px", fontSize: "14px", fontWeight: 600, cursor: "pointer" }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
