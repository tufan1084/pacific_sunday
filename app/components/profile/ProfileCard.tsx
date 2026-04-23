"use client";

import { useState } from "react";
import { PROFILE_USER } from "@/app/lib/profile-data";
import { resolveMediaUrl } from "@/app/lib/constants";
import { getCode } from "country-list";

interface ProfileCardProps {
  profileData?: any;
  golfPassport?: any;
}

export default function ProfileCard({ profileData, golfPassport }: ProfileCardProps) {
  const [photoError, setPhotoError] = useState(false);

  const profilePhoto = (!photoError && golfPassport?.photoUrl) ? golfPassport.photoUrl : null;

  // Use real data from API if available, otherwise use mock data
  const user = profileData?.user || PROFILE_USER;
  const name = user.name || PROFILE_USER.name;
  const username = user.username || null;
  const email = user.email || PROFILE_USER.username;
  const countryName = user.country || null;
  const totalBags = user.totalBags !== undefined ? user.totalBags : 0;

  // Get country code for flag image
  const countryCode = countryName ? getCode(countryName) : null;

  // Format member since date from createdAt
  const memberSince = user.memberSince
    ? new Date(user.memberSince).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : PROFILE_USER.member;

  // Generate initials from name
  const initials = name
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const badges = [
    PROFILE_USER.rank,
    PROFILE_USER.pts,
    PROFILE_USER.weeks,
    `${totalBags} Bags`,
  ];

  return (
    <div style={{ backgroundColor: "#13192A", borderRadius: "5px", padding: "20px", fontFamily: "var(--font-poppins), sans-serif" }}>
      {/* Avatar + name */}
      <div className="flex items-center gap-3" style={{ marginBottom: "16px" }}>
        <div style={{ width: "50px", height: "50px", borderRadius: "3px", border: "1.5px solid #E8C96A", backgroundColor: "#060D1F", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
          {profilePhoto ? (
            <img
              src={resolveMediaUrl(profilePhoto)}
              alt={name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={() => setPhotoError(true)}
            />
          ) : (
            <span style={{ color: "#E8C96A", fontSize: "18px", fontWeight: 600 }}>{initials}</span>
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ color: "#E8C96A", fontSize: "clamp(15px, 1.8vw, 20px)", fontWeight: 500 }}>{name}</div>
          {username && (
            <div style={{ color: "#FFFFFF", fontSize: "clamp(10px, 1.1vw, 12px)", fontWeight: 400, marginTop: "2px" }}>@{username}</div>
          )}
          <div style={{ color: "#FFFFFF", fontSize: "clamp(11px, 1.2vw, 14px)", fontWeight: 400, marginTop: "4px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</span>
            <span>·</span>
            {countryName ? (
              <span style={{ display: "flex", alignItems: "center", gap: "4px", flexShrink: 0 }}>
                <span>{countryName}</span>
                {countryCode && (
                  <img
                    src={`https://flagcdn.com/24x18/${countryCode.toLowerCase()}.png`}
                    alt={countryName}
                    width="20"
                    height="15"
                    style={{ display: "inline-block" }}
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                )}
              </span>
            ) : (
              <span>Not specified</span>
            )}
            <span>·</span>
            <span style={{ whiteSpace: "nowrap" }}>Member {memberSince}</span>
          </div>
        </div>
      </div>

      {/* Stat badges */}
      <div className="flex flex-wrap gap-2">
        {badges.map((badge, i) => (
          <div key={i} style={{ border: "1px solid #E8C96A", borderRadius: "999px", padding: "6px clamp(12px, 2vw, 24px)", display: "flex", alignItems: "center", justifyContent: "center", color: "#E8C96A", fontSize: "clamp(11px, 1.1vw, 13px)", fontWeight: 400, whiteSpace: "nowrap" }}>
            {badge}
          </div>
        ))}
      </div>
    </div>
  );
}
