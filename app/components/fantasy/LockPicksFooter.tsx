export default function LockPicksFooter() {
  return (
    <div style={{ marginTop: "16px" }}>
      <button
        style={{
          width: "100%",
          height: "clamp(44px, 4.5vw, 56px)",
          backgroundColor: "#E8C96A",
          color: "#060D1F",
          fontSize: "16px",
          fontWeight: 600,
          fontFamily: "var(--font-poppins), sans-serif",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Lock in my picks
      </button>
      <div
        style={{
          fontSize: "clamp(11px, 1vw, 14px)",
          color: "#FFFFFF",
          fontWeight: 400,
          fontFamily: "var(--font-poppins), sans-serif",
          marginTop: "12px",
          textAlign: "center",
        }}
      >
        Locks Thu Apr 10, 8:00 AM ET · Cannot change after
      </div>
    </div>
  );
}
