import Link from "next/link";

export default function ProfileActions() {
  return (
    <div className="grid grid-cols-2 gap-3" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
      <Link href="/settings" style={{ backgroundColor: "transparent", border: "1px solid #E8C96A", borderRadius: "5px", color: "#E8C96A", padding: "12px", fontSize: "16px", fontWeight: 400, fontFamily: "var(--font-poppins), sans-serif", cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
        Settings
      </Link>
      <button style={{ backgroundColor: "transparent", border: "1px solid #E8C96A", borderRadius: "5px", color: "#E8C96A", padding: "12px", fontSize: "16px", fontWeight: 400, fontFamily: "var(--font-poppins), sans-serif", cursor: "pointer" }}>
        Sign Out
      </button>
    </div>
  );
}
