"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { IoAdd, IoEarthOutline, IoLockClosedOutline, IoChevronDown } from "react-icons/io5";
import type { Team } from "@/app/types/community";

const DEFAULT_TABS = ["All Post", "Pinned"];
const ALL_OWNERS = "All Owners";

interface CommunityFiltersProps {
  teams: Team[];
  tabs?: string[];
  activeFilter: string;
  activeTab: string;
  onFilterChange: (filter: string) => void;
  onTabChange: (tab: string) => void;
  onAddTeam: () => void;
}

export default function CommunityFilters({
  teams, tabs, activeFilter, activeTab, onFilterChange, onTabChange, onAddTeam,
}: CommunityFiltersProps) {
  const tabList = tabs && tabs.length > 0 ? tabs : DEFAULT_TABS;
  const [teamOpen, setTeamOpen] = useState(false);
  const [tabOpen, setTabOpen] = useState(false);
  const teamRef = useRef<HTMLDivElement>(null);
  const tabRef = useRef<HTMLDivElement>(null);

  const allOwners = { name: ALL_OWNERS, privacy: null as null | "public" | "private" };
  const teamOptions = [
    allOwners,
    ...teams.map(t => ({ name: t.name, privacy: t.privacy as "public" | "private" })),
  ];

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (teamRef.current && !teamRef.current.contains(e.target as Node)) setTeamOpen(false);
      if (tabRef.current && !tabRef.current.contains(e.target as Node)) setTabOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setTeamOpen(false); setTabOpen(false); }
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const iconFor = (privacy: "public" | "private" | null, size = 14) => {
    if (privacy === null) {
      return (
        <Image
          src="/icons/earth.svg"
          alt=""
          width={size + 2}
          height={size + 2}
          style={{ filter: "brightness(0) invert(1)" }}
        />
      );
    }
    return privacy === "public"
      ? <IoEarthOutline size={size} color="#FFFFFF" />
      : <IoLockClosedOutline size={size} color="#FFFFFF" />;
  };

  const activeTeam = teams.find(t => t.name === activeFilter);
  const activePrivacy: "public" | "private" | null =
    activeFilter === ALL_OWNERS ? null : activeTeam?.privacy ?? null;

  const buttonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "8px",
    padding: "10px 12px",
    backgroundColor: "#13192A",
    borderRadius: "8px",
    border: "1px solid rgba(232,201,106,0.25)",
    color: "#FFFFFF",
    fontSize: "13px",
    fontWeight: 500,
    fontFamily: "var(--font-poppins), sans-serif",
    cursor: "pointer",
    width: "100%",
    minWidth: 0,
  };

  const menuStyle: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 6px)",
    left: 0,
    right: 0,
    zIndex: 30,
    backgroundColor: "#0E1424",
    border: "1px solid rgba(232,201,106,0.25)",
    borderRadius: "8px",
    overflow: "hidden",
    boxShadow: "0 10px 24px rgba(0,0,0,0.45)",
    maxHeight: "280px",
    overflowY: "auto",
  };

  const menuItem = (isActive: boolean): React.CSSProperties => ({
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px 12px",
    border: "none",
    background: isActive ? "rgba(232,201,106,0.15)" : "transparent",
    color: isActive ? "#E8C96A" : "#FFFFFF",
    cursor: "pointer",
    width: "100%",
    textAlign: "left",
    fontSize: "13px",
    fontFamily: "var(--font-poppins), sans-serif",
  });

  return (
    <div className="flex items-center gap-2" style={{ marginBottom: "10px", minWidth: 0 }}>
      {/* Team dropdown */}
      <div ref={teamRef} style={{ position: "relative", flex: 1, minWidth: 0 }}>
        <button
          onClick={() => { setTeamOpen(v => !v); setTabOpen(false); }}
          style={buttonStyle}
        >
          <span className="flex items-center gap-2" style={{ minWidth: 0 }}>
            {iconFor(activePrivacy, 14)}
            <span
              style={{
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
            >
              {activeFilter}
            </span>
          </span>
          <IoChevronDown size={14} color="#E8C96A" style={{ flexShrink: 0 }} />
        </button>

        {teamOpen && (
          <div style={menuStyle}>
            {teamOptions.map(({ name, privacy }) => {
              const isActive = activeFilter === name;
              return (
                <button
                  key={name}
                  onClick={() => { onFilterChange(name); setTeamOpen(false); }}
                  style={menuItem(isActive)}
                >
                  {iconFor(privacy, 14)}
                  <span
                    style={{
                      flex: 1, minWidth: 0,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}
                  >
                    {name}
                  </span>
                </button>
              );
            })}
            <button
              onClick={() => { setTeamOpen(false); onAddTeam(); }}
              style={{
                ...menuItem(false),
                color: "#E8C96A",
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <IoAdd size={16} />
              <span>Create team</span>
            </button>
          </div>
        )}
      </div>

      {/* Post filter dropdown */}
      <div ref={tabRef} style={{ position: "relative", flex: 1, minWidth: 0 }}>
        <button
          onClick={() => { setTabOpen(v => !v); setTeamOpen(false); }}
          style={buttonStyle}
        >
          <span
            style={{
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}
          >
            {activeTab}
          </span>
          <IoChevronDown size={14} color="#E8C96A" style={{ flexShrink: 0 }} />
        </button>

        {tabOpen && (
          <div style={menuStyle}>
            {tabList.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => { onTabChange(tab); setTabOpen(false); }}
                  style={menuItem(isActive)}
                >
                  <span
                    style={{
                      flex: 1, minWidth: 0,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}
                  >
                    {tab}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
