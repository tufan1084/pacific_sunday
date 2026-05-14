"use client";

import { useState } from "react";

interface FilterDropdownProps {
  currentFilter: { year?: number; month?: number; type?: string };
  onFilterChange: (filter: { year?: number; month?: number; type?: string }) => void;
}

export default function FilterDropdown({ currentFilter, onFilterChange }: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const currentYear = new Date().getFullYear();

  const filters = [
    { label: "All Time", value: {} },
    { label: "This Year", value: { year: currentYear } },
    { label: "Last Year", value: { year: currentYear - 1 } },
    { label: "Tournaments Only", value: { type: "tournament_reward" } },
  ];

  const getFilterLabel = () => {
    if (!currentFilter.year && !currentFilter.type) return "All Time";
    if (currentFilter.type === "tournament_reward") return "Tournaments Only";
    if (currentFilter.year === currentYear) return "This Year";
    if (currentFilter.year === currentYear - 1) return "Last Year";
    return `Year ${currentFilter.year}`;
  };

  return (
    <div style={{ position: "relative", fontFamily: "var(--font-poppins), sans-serif" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          backgroundColor: "transparent",
          border: "1px solid #E8C96A",
          borderRadius: "5px",
          color: "#E8C96A",
          fontSize: "clamp(12px, 3vw, 14px)",
          fontWeight: 400,
          padding: "clamp(6px, 1.5vw, 8px) clamp(12px, 3vw, 16px)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          whiteSpace: "nowrap",
        }}
      >
        {getFilterLabel()}
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="2" style={{ flexShrink: 0 }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 10 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 4px)",
              right: 0,
              backgroundColor: "#13192A",
              border: "1px solid #1E2A47",
              borderRadius: "5px",
              minWidth: "clamp(160px, 40vw, 180px)",
              zIndex: 20,
              boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            {filters.map((filter, i) => (
              <button
                key={i}
                onClick={() => {
                  onFilterChange(filter.value);
                  setOpen(false);
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "clamp(8px, 2vw, 10px) clamp(12px, 3vw, 16px)",
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#FFFFFF",
                  fontSize: "clamp(12px, 3vw, 14px)",
                  cursor: "pointer",
                  borderBottom: i < filters.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(232,201,106,0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
