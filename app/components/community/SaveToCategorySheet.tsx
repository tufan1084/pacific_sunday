"use client";

import { useEffect, useState } from "react";
import { IoClose, IoAdd, IoCheckmarkCircle, IoFolderOpenOutline } from "react-icons/io5";
import { api, ApiSavedCategory } from "@/app/services/api";
import { useToast } from "@/app/context/ToastContext";

interface Props {
  postId: number;
  currentCategoryId: number | null;
  onClose: () => void;
  onSaved: (categoryId: number | null) => void;
}

export default function SaveToCategorySheet({ postId, currentCategoryId, onClose, onSaved }: Props) {
  const toast = useToast();
  const [categories, setCategories] = useState<ApiSavedCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showNewInput, setShowNewInput] = useState(false);
  const [busy, setBusy] = useState(false);
  // Local selection — clicking a row picks it, the bottom "Save" button commits.
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(currentCategoryId);

  useEffect(() => {
    let cancelled = false;
    api.savedCategories.list().then((res) => {
      if (cancelled) return;
      if (res.success && res.data) setCategories(res.data.categories);
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const res = await api.savedCategories.create(name);
      if (res.success && res.data?.category) {
        setCategories((prev) => [...prev, res.data!.category]);
        setSelectedCategoryId(res.data.category.id); // auto-select the newly created one
        setNewName("");
        setShowNewInput(false);
      } else {
        toast.error(res.message || "Couldn't create category");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const res = await api.posts.save(postId, selectedCategoryId);
      if (res.success) {
        onSaved(selectedCategoryId);
      } else {
        toast.error(res.message || "Couldn't save post");
      }
    } catch {
      toast.error("Couldn't save post");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        backgroundColor: "rgba(0,0,0,0.65)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px", fontFamily: "var(--font-poppins), sans-serif",
      }}
    >
      <div
        style={{
          backgroundColor: "#13192A",
          borderRadius: "10px",
          width: "min(420px, 100%)",
          maxHeight: "min(560px, 90vh)",
          display: "flex",
          flexDirection: "column",
          border: "1px solid rgba(232,201,106,0.2)",
        }}
      >
        <div className="flex items-center justify-between" style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ color: "#E8C96A", fontWeight: 600, fontSize: "15px" }}>Save to category</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", padding: "4px" }} aria-label="Close">
            <IoClose size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
          {loading ? (
            <div style={{ padding: "24px", color: "#888", fontSize: "12px", textAlign: "center" }}>Loading…</div>
          ) : (
            <>
              <button
                onClick={() => setSelectedCategoryId(null)}
                disabled={busy}
                className="flex items-center"
                style={{
                  gap: "12px", width: "100%", padding: "10px 12px",
                  background: selectedCategoryId === null ? "rgba(232,201,106,0.12)" : "transparent",
                  border: "none", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit",
                  textAlign: "left", color: "#FFF",
                }}
              >
                <IoFolderOpenOutline size={18} color="rgba(255,255,255,0.5)" />
                <span style={{ flex: 1, fontSize: "13px" }}>No category</span>
                {selectedCategoryId === null && <IoCheckmarkCircle size={16} color="#E8C96A" />}
              </button>

              {categories.length === 0 ? (
                <div style={{ padding: "10px 12px", color: "rgba(255,255,255,0.4)", fontSize: "11.5px" }}>
                  No categories yet. Create one below.
                </div>
              ) : (
                categories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedCategoryId(c.id)}
                    disabled={busy}
                    className="flex items-center"
                    style={{
                      gap: "12px", width: "100%", padding: "10px 12px",
                      background: selectedCategoryId === c.id ? "rgba(232,201,106,0.12)" : "transparent",
                      border: "none", borderRadius: "6px", cursor: "pointer", fontFamily: "inherit",
                      textAlign: "left", color: "#FFF",
                    }}
                  >
                    <IoFolderOpenOutline size={18} color="#E8C96A" />
                    <span style={{ flex: 1, fontSize: "13px" }}>{c.name}</span>
                    {typeof c.postCount === "number" && c.postCount > 0 && (
                      <span style={{ color: "rgba(255,255,255,0.4)", fontSize: "11px" }}>{c.postCount}</span>
                    )}
                    {selectedCategoryId === c.id && <IoCheckmarkCircle size={16} color="#E8C96A" />}
                  </button>
                ))
              )}
            </>
          )}
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "10px 12px" }}>
          <button
            onClick={handleSave}
            disabled={busy || loading}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "none",
              backgroundColor: busy || loading ? "rgba(232,201,106,0.4)" : "#E8C96A",
              color: "#060D1F",
              fontSize: "13px",
              fontWeight: 600,
              cursor: busy || loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              marginBottom: "8px",
            }}
          >
            {busy ? "Saving…" : "Save"}
          </button>
          {showNewInput ? (
            <div className="flex items-center" style={{ gap: "8px" }}>
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreate(); if (e.key === "Escape") { setShowNewInput(false); setNewName(""); } }}
                placeholder="Category name"
                maxLength={50}
                disabled={creating}
                style={{
                  flex: 1, padding: "8px 10px", borderRadius: "5px",
                  backgroundColor: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  color: "#FFF", fontSize: "12.5px", fontFamily: "inherit", outline: "none",
                }}
              />
              <button
                onClick={handleCreate}
                disabled={!newName.trim() || creating}
                style={{
                  padding: "8px 14px", borderRadius: "5px", border: "none",
                  backgroundColor: !newName.trim() || creating ? "rgba(232,201,106,0.3)" : "#E8C96A",
                  color: "#060D1F", fontSize: "12px", fontWeight: 600,
                  cursor: !newName.trim() || creating ? "not-allowed" : "pointer", fontFamily: "inherit",
                }}
              >
                Create
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewInput(true)}
              className="flex items-center"
              style={{
                gap: "8px", width: "100%", padding: "8px 10px",
                background: "none", border: "none", color: "#E8C96A",
                fontSize: "12.5px", cursor: "pointer", fontFamily: "inherit",
              }}
            >
              <IoAdd size={18} />
              <span>New category</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
