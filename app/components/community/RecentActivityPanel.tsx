"use client";

import { useEffect, useState, useMemo } from "react";
import { api } from "@/app/services/api";

interface RecentActivityPanelProps {
  posts: any[];
}

interface ActivityItem {
  key: string;
  initials: string;
  name: string;
  preview: string;
  createdAt: string;
}

function getTimeAgo(date: string) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function initialsFrom(name: string): string {
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

const dividerStyle = {
  height: "1.5px",
  backgroundColor: "rgba(255,255,255,0.15)",
  marginLeft: "-16px",
  marginRight: "-16px",
};

export default function RecentActivityPanel({ posts }: RecentActivityPanelProps) {
  const [commentsByPost, setCommentsByPost] = useState<Record<number, any[]>>({});
  const [loading, setLoading] = useState(true);

  // Fetch comments for the 5 most recent posts that have any comments
  useEffect(() => {
    let cancelled = false;
    const postsWithComments = posts
      .filter(p => (p._count?.comments || 0) > 0)
      .slice(0, 5);

    if (postsWithComments.length === 0) {
      setCommentsByPost({});
      setLoading(false);
      return;
    }

    setLoading(true);
    Promise.all(postsWithComments.map(async (p) => {
      try {
        const res = await api.posts.getComments(p.id);
        const data = (res.data as any)?.comments || [];
        return [p.id, data] as [number, any[]];
      } catch {
        return [p.id, []] as [number, any[]];
      }
    })).then((results) => {
      if (cancelled) return;
      const map: Record<number, any[]> = {};
      for (const [id, list] of results) map[id] = list;
      setCommentsByPost(map);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [posts]);

  const activity: ActivityItem[] = useMemo(() => {
    const items: ActivityItem[] = [];

    // Latest comments (flat) as activity
    for (const [postIdStr, comments] of Object.entries(commentsByPost)) {
      for (const c of comments) {
        const name = c.user?.profile?.name || c.user?.username || "Owner";
        items.push({
          key: `c-${c.id}`,
          initials: initialsFrom(name),
          name,
          preview: `"${(c.content || "").slice(0, 60)}${(c.content || "").length > 60 ? "…" : ""}"`,
          createdAt: c.createdAt,
        });
        for (const r of (c.replies || [])) {
          const rName = r.user?.profile?.name || r.user?.username || "Owner";
          items.push({
            key: `r-${r.id}`,
            initials: initialsFrom(rName),
            name: rName,
            preview: `"${(r.content || "").slice(0, 60)}${(r.content || "").length > 60 ? "…" : ""}"`,
            createdAt: r.createdAt,
          });
        }
      }
    }

    // Fall back to recent posts if there are no comments
    if (items.length === 0) {
      for (const p of posts.slice(0, 4)) {
        const name = p.user?.profile?.name || p.user?.username || "Owner";
        items.push({
          key: `p-${p.id}`,
          initials: initialsFrom(name),
          name,
          preview: `"${(p.content || "").slice(0, 60)}${(p.content || "").length > 60 ? "…" : ""}"`,
          createdAt: p.createdAt,
        });
      }
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return items.slice(0, 5);
  }, [commentsByPost, posts]);

  return (
    <div
      style={{
        backgroundColor: "#13192A",
        borderRadius: "5px",
        padding: "20px 16px",
        fontFamily: "var(--font-poppins), sans-serif",
      }}
    >
      <div style={{ paddingBottom: "14px", paddingTop: "4px" }}>
        <span style={{ fontSize: "16px", color: "#E8C96A", fontWeight: 500 }}>Recent Activity</span>
      </div>
      <div style={dividerStyle} />

      {loading && activity.length === 0 ? (
        <div style={{ color: "#888", fontSize: "13px", paddingTop: "14px" }}>
          Loading activity...
        </div>
      ) : activity.length === 0 ? (
        <div style={{ color: "#888", fontSize: "13px", paddingTop: "14px", lineHeight: "1.5" }}>
          No activity yet. Post something to get the conversation started.
        </div>
      ) : (
        activity.map((item, i) => (
          <div key={item.key}>
            <div className="flex items-center gap-3" style={{ paddingTop: "10px", paddingBottom: "10px" }}>
              <div
                style={{
                  width: "34px", height: "34px", borderRadius: "5px",
                  backgroundColor: "#060D1F", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "10px", fontWeight: 700,
                  color: "#E8C96A", flexShrink: 0,
                }}
              >
                {item.initials}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    color: "#E8C96A", fontWeight: 500, fontSize: "13px",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}
                >
                  {item.name}
                </div>
                <div
                  style={{
                    color: "#888888", fontSize: "12px", fontWeight: 400,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                  }}
                >
                  {item.preview} · {getTimeAgo(item.createdAt)}
                </div>
              </div>
            </div>
            {i < activity.length - 1 && <div style={dividerStyle} />}
          </div>
        ))
      )}
    </div>
  );
}
