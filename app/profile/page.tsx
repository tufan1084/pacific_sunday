"use client";

import { useEffect, useState } from "react";
import { api } from "@/app/services/api";
import ProfileCard from "@/app/components/profile/ProfileCard";
import GolfPassport from "@/app/components/profile/GolfPassport";
import YourGolfStats from "@/app/components/profile/YourGolfStats";
import PointsHistory from "@/app/components/profile/PointsHistory";
import ProfileActions from "@/app/components/profile/ProfileActions";

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<any>(null);
  const [golfPassport, setGolfPassport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = async () => {
    try {
      const [profileRes, passportRes] = await Promise.all([
        api.profile.get(),
        api.profile.getGolfPassport(),
      ]);

      if (profileRes.success) {
        setProfileData(profileRes.data);
      } else {
        setError(profileRes.message || "Failed to load profile");
      }

      if (passportRes.success && (passportRes.data as any)?.golfPassport) {
        setGolfPassport((passportRes.data as any).golfPassport);
      }
    } catch (err) {
      setError("Could not connect to server");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "calc(100vh - 120px)" }}>
        <div style={{ textAlign: "center" }}>
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8C96A]/20 border-t-[#E8C96A]" style={{ margin: "0 auto 16px" }} />
          <p style={{ color: "#94A3B8", fontFamily: "var(--font-poppins), sans-serif" }}>Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ height: "calc(100vh - 120px)" }}>
        <div className="text-center">
          <p style={{ color: "#EF4444", fontFamily: "var(--font-poppins), sans-serif" }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div style={{ fontFamily: "var(--font-poppins), sans-serif", marginBottom: "24px" }}>
        <span style={{ color: "#E8C96A", fontSize: "clamp(18px, 2.5vw, 25px)", fontWeight: 400 }}>My Profile</span>
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4 items-stretch">

        {/* Left - Profile card + Golf Passport */}
        <div className="flex flex-col gap-4">
          <ProfileCard profileData={profileData} golfPassport={golfPassport} />
          <GolfPassport profileData={profileData} golfPassport={golfPassport} onUpdate={fetchAll} />
        </div>

        {/* Right - Golf Stats + Points History + Actions - stretches to match left */}
        <div className="flex flex-col gap-4">
          <YourGolfStats golfPassport={golfPassport} />
          <div style={{ flex: 1 }}>
            <PointsHistory />
          </div>
          <ProfileActions />
        </div>

      </div>
    </>
  );
}
