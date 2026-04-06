"use client";

import { useState } from "react";
import Image from "next/image";
import type { TierSection } from "@/app/types/fantasy";

interface TierPickListProps {
  sections: TierSection[];
}

const dividerStyle = {
  height: "1.5px",
  backgroundColor: "rgba(255,255,255,0.15)",
  marginLeft: "-16px",
  marginRight: "-16px",
};

export default function TierPickList({ sections }: TierPickListProps) {
  const [selected, setSelected] = useState<Record<string, number | null>>(
    () => Object.fromEntries(
      sections.map((s) => [
        s.name,
        s.golfers.find((g) => g.isSelected)?.rank ?? null,
      ])
    )
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {sections.map((section) => (
        <div
          key={section.name}
          style={{
            backgroundColor: "#13192A",
            borderRadius: "5px",
            padding: "20px 16px",
            fontFamily: "var(--font-poppins), sans-serif",
          }}
        >
          {/* Section header */}
          <div
            className="flex items-center gap-3"
            style={{ paddingBottom: "20px", paddingTop: "8px" }}
          >
            <Image
              src="/icons/tire-logo.svg"
              alt={section.name}
              width={32}
              height={32}
              style={{ flexShrink: 0 }}
            />
            <div style={{ fontSize: "clamp(14px, 1.4vw, 18px)", color: "#E8C96A", fontWeight: 600 }}>
              {section.name}
            </div>
          </div>
          <div style={dividerStyle} />

          {/* Golfer rows */}
          {section.golfers.map((golfer, i) => {
            const isSelected = selected[section.name] === golfer.rank;
            return (
              <div key={golfer.rank}>
                <div
                  className="flex items-center justify-between"
                  style={{ height: "clamp(56px, 5vw, 68px)" }}
                >
                  {/* Left: rank + avatar + info */}
                  <div className="flex items-center" style={{ gap: "10px", minWidth: 0 }}>
                    <span
                      style={{
                        color: "#E8C96A",
                        width: "16px",
                        textAlign: "right",
                        flexShrink: 0,
                        fontSize: "clamp(11px, 1.1vw, 16px)",
                      }}
                    >
                      {golfer.rank}.
                    </span>

                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "5px",
                        backgroundColor: "#060D1F",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "10px",
                        fontWeight: 700,
                        color: "#E8C96A",
                        flexShrink: 0,
                      }}
                    >
                      {golfer.initials}
                    </div>

                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          color: "#E8C96A",
                          fontWeight: 500,
                          fontSize: "clamp(12px, 1.1vw, 16px)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {golfer.name}
                      </div>
                      <div
                        style={{
                          color: "#FFFFFF",
                          fontSize: "clamp(11px, 1vw, 15px)",
                          fontWeight: 400,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {golfer.club}
                      </div>
                    </div>
                  </div>

                  {/* Right: score + square radio */}
                  <div className="flex items-center" style={{ gap: "12px", flexShrink: 0 }}>
                    <span
                      style={{
                        color: "#E8C96A",
                        fontWeight: 500,
                        fontSize: "clamp(12px, 1.1vw, 16px)",
                      }}
                    >
                      {golfer.score}
                    </span>

                    <div
                      onClick={() => setSelected((prev) => ({ ...prev, [section.name]: golfer.rank }))}
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "4px",
                        border: "1.5px solid #E8C96A",
                        backgroundColor: isSelected ? "#E8C96A" : "transparent",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    >
                      {isSelected && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#060D1F" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>

                {i < section.golfers.length - 1 && <div style={dividerStyle} />}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
