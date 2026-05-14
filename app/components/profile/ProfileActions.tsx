"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import LogoutModal from "@/app/components/ui/LogoutModal";

export default function ProfileActions() {
  const router = useRouter();
  const { logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleSignOut = () => {
    logout();
    router.push('/login');
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-3" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
        <Link href="/settings" style={{ backgroundColor: "transparent", border: "1px solid #E8C96A", borderRadius: "5px", color: "#E8C96A", padding: "12px", fontSize: "16px", fontWeight: 400, fontFamily: "var(--font-poppins), sans-serif", cursor: "pointer", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center" }}>
          Settings
        </Link>
        <button onClick={() => setShowLogoutModal(true)} style={{ backgroundColor: "transparent", border: "1px solid #E8C96A", borderRadius: "5px", color: "#E8C96A", padding: "12px", fontSize: "16px", fontWeight: 400, fontFamily: "var(--font-poppins), sans-serif", cursor: "pointer" }}>
          Sign Out
        </button>
      </div>

      {showLogoutModal && (
        <LogoutModal
          onConfirm={handleSignOut}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </>
  );
}
