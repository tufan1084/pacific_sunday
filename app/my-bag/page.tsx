"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/services/api";
import BagOwnerCard from "@/app/components/my-bag/BagOwnerCard";
import BagDetails from "@/app/components/my-bag/BagDetails";
import NFCScanHistory from "@/app/components/my-bag/NFCScanHistory";

export default function MyBagPage() {
  const [bagsData, setBagsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchBags = async () => {
      try {
        const response = await api.profile.getBags();
        if (response.success) {
          setBagsData(response.data);
        } else {
          setError(response.message || "Failed to load bags");
        }
      } catch (err) {
        setError("Could not connect to server");
      } finally {
        setLoading(false);
      }
    };

    fetchBags();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "calc(100vh - 120px)" }}>
        <div style={{ textAlign: "center" }}>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8C96A]/20 border-t-[#E8C96A]" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "#94A3B8", fontFamily: "var(--font-poppins), sans-serif" }}>Loading bags...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "400px" }}>
        <div className="text-center">
          <p style={{ color: "#EF4444", fontFamily: "var(--font-poppins), sans-serif" }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
        <span style={{ color: "#E8C96A", fontSize: "clamp(18px, 2.5vw, 25px)", fontWeight: 400 }}>My Bag</span>
      </div>

      {/* Owner stats card */}
      <BagOwnerCard bagsData={bagsData} />

      {/* Bottom layout: Bag Details (left) + NFC Scan History (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[4fr_2fr] gap-6 items-stretch" style={{ marginTop: "20px" }}>
        <BagDetails bagsData={bagsData} />
        <NFCScanHistory bagsData={bagsData} />
      </div>
    </>
  );
}
