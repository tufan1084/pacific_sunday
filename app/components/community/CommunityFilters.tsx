"use client";

import { useState } from "react";
import Image from "next/image";
import { COMMUNITY_FILTERS, COMMUNITY_TABS } from "@/app/lib/community-data";

const FILTER_ICONS: Record<string, string> = {
  "All Owners": "/icons/earth.svg",
  "Team Ryan": "/icons/team-ryon.svg",
  "Pyro Club": "/icons/pylo-club.svg",
  "Pokegolf": "/icons/poky-golf.svg",
};

export default function CommunityFilters() {
  const [activeFilter, setActiveFilter] = useState("All Owners");
  const [activeTab, setActiveTab] = useState("All Post");

  return (
    <div style={{ marginBottom: "20px" }}>
      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 sm:gap-4" style={{ marginBottom: "20px", marginTop: "24px" }}>
        {COMMUNITY_FILTERS.map((filter) => {
          const isActive = activeFilter === filter;
          return (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className="flex items-center gap-2"
              style={{
                padding: "8px clamp(14px, 2.5vw, 40px)",
                borderRadius: "999px",
                border: "none",
                backgroundColor: isActive ? "#E8C96A" : "#13192A",
                color: isActive ? "#060D1F" : "#FFFFFF",
                fontSize: "clamp(12px, 1.3vw, 16px)",
                fontWeight: isActive ? 500 : 400,
                fontFamily: "var(--font-poppins), sans-serif",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              <Image
                src={FILTER_ICONS[filter]}
                alt={filter}
                width={filter === "All Owners" ? 20 : 16}
                height={filter === "All Owners" ? 20 : 16}
                style={{ filter: isActive ? "brightness(0)" : "brightness(0) invert(1)" }}
              />
              {filter}
            </button>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2" style={{ marginBottom: "28px" }}>
        {COMMUNITY_TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "7px clamp(14px, 2vw, 28px)",
                borderRadius: "5px",
                border: isActive ? "1.5px solid #E8C96A" : "1.5px solid rgba(255,255,255,0.5)",
                backgroundColor: "transparent",
                color: isActive ? "#E8C96A" : "#FFFFFF",
                fontSize: "clamp(12px, 1.3vw, 16px)",
                fontWeight: isActive ? 500 : 400,
                fontFamily: "var(--font-poppins), sans-serif",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {tab}
            </button>
          );
        })}
      </div>
    </div>
  );
}
