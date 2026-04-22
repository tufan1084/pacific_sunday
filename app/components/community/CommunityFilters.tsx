"use client";

import Image from "next/image";
import { IoAdd, IoEarthOutline, IoLockClosedOutline } from "react-icons/io5";
import type { Team } from "@/app/types/community";

const TABS = ["All Post", "Pinned", "Fantasy Talk", "Bag Flex"];
const ALL_OWNERS = "All Owners";

interface CommunityFiltersProps {
  teams: Team[];
  activeFilter: string; // team name or "All Owners"
  activeTab: string;
  onFilterChange: (filter: string) => void;
  onTabChange: (tab: string) => void;
  onAddTeam: () => void;
}

export default function CommunityFilters({
  teams, activeFilter, activeTab, onFilterChange, onTabChange, onAddTeam,
}: CommunityFiltersProps) {
  const allPill = { name: ALL_OWNERS, privacy: null as null | "public" | "private" };
  const pills = [allPill, ...teams.map(t => ({ name: t.name, privacy: t.privacy as "public" | "private" }))];

  return (
    <div style={{ marginBottom: "20px" }}>
      {/* Team filter pills */}
      <div
        className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar"
        style={{ marginBottom: "20px", marginTop: "24px", paddingBottom: "4px", WebkitOverflowScrolling: "touch" }}
      >
        {pills.map(({ name, privacy }) => {
          const isActive = activeFilter === name;
          return (
            <button
              key={name}
              onClick={() => onFilterChange(name)}
              className="flex items-center gap-2 flex-shrink-0"
              style={{
                padding: "8px clamp(14px, 2.5vw, 28px)",
                borderRadius: "999px",
                border: "none",
                backgroundColor: isActive ? "#E8C96A" : "#13192A",
                color: isActive ? "#060D1F" : "#FFFFFF",
                fontSize: "clamp(12px, 1.3vw, 14px)",
                fontWeight: isActive ? 500 : 400,
                fontFamily: "var(--font-poppins), sans-serif",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {privacy === null ? (
                <Image
                  src="/icons/earth.svg"
                  alt={name}
                  width={18}
                  height={18}
                  style={{ filter: isActive ? "brightness(0)" : "brightness(0) invert(1)" }}
                />
              ) : privacy === "public" ? (
                <IoEarthOutline size={14} />
              ) : (
                <IoLockClosedOutline size={14} />
              )}
              {name}
            </button>
          );
        })}

        <button
          onClick={onAddTeam}
          className="flex items-center gap-1 flex-shrink-0"
          style={{
            padding: "8px 16px",
            borderRadius: "999px",
            border: "1px dashed rgba(232,201,106,0.5)",
            backgroundColor: "transparent",
            color: "#E8C96A",
            fontSize: "clamp(12px, 1.3vw, 14px)",
            fontWeight: 500,
            fontFamily: "var(--font-poppins), sans-serif",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          <IoAdd size={16} />
          Add Team
        </button>
      </div>

      {/* Content tabs */}
      <div
        className="flex gap-2 overflow-x-auto no-scrollbar"
        style={{ marginBottom: "28px", paddingBottom: "4px", WebkitOverflowScrolling: "touch" }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className="flex-shrink-0"
              style={{
                padding: "7px clamp(14px, 2vw, 24px)",
                borderRadius: "5px",
                border: isActive ? "1.5px solid #E8C96A" : "1.5px solid rgba(255,255,255,0.3)",
                backgroundColor: "transparent",
                color: isActive ? "#E8C96A" : "#FFFFFF",
                fontSize: "clamp(12px, 1.3vw, 14px)",
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
