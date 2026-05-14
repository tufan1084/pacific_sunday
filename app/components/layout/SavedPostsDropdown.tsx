"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FiBookmark, FiPlus, FiFolder, FiTrash2, FiEdit2 } from "react-icons/fi";
import { api, ApiSavedCategory } from "@/app/services/api";
import { useToast } from "@/app/context/ToastContext";

export default function SavedPostsDropdown() {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<ApiSavedCategory[]>([]);
  const [uncategorizedCount, setUncategorizedCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showCreateInput, setShowCreateInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: number; name: string } | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [updating, setUpdating] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const toast = useToast();

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.savedCategories.list();
      if (res.success && res.data) {
        setCategories(res.data.categories);
        setUncategorizedCount(res.data.uncategorizedCount);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = (e: Event) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowCreateInput(false);
        setNewCategoryName("");
      }
    };
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
    };
  }, []);

  useEffect(() => {
    if (showCreateInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showCreateInput]);

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      await loadCategories();
    }
  };

  const handleCategoryClick = (categoryId: number | "uncategorized") => {
    setOpen(false);
    const currentPath = window.location.pathname;
    
    // If already on community page, use router.push to trigger navigation
    if (currentPath === '/community') {
      router.push(`/community?tab=Saved&savedCategory=${categoryId}`);
    } else {
      router.push(`/community?tab=Saved&savedCategory=${categoryId}`);
    }
  };

  const handleCreateCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) {
      toast.error("Category name cannot be empty");
      return;
    }

    setCreating(true);
    try {
      const res = await api.savedCategories.create(name);
      if (res.success) {
        toast.success("Category created");
        setNewCategoryName("");
        setShowCreateInput(false);
        await loadCategories();
      } else {
        toast.error(res.message || "Failed to create category");
      }
    } catch (error) {
      toast.error("Failed to create category");
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCreateCategory();
    } else if (e.key === "Escape") {
      setShowCreateInput(false);
      setNewCategoryName("");
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, category: ApiSavedCategory) => {
    e.stopPropagation();
    setCategoryToDelete({ id: category.id, name: category.name });
    setShowDeleteConfirm(true);
  };

  const handleEditClick = (e: React.MouseEvent, category: ApiSavedCategory) => {
    e.stopPropagation();
    setEditingCategoryId(category.id);
    setEditName(category.name);
  };

  const handleUpdateCategory = async (categoryId: number) => {
    const name = editName.trim();
    if (!name) {
      toast.error("Category name cannot be empty");
      return;
    }

    setUpdating(true);
    try {
      const res = await api.savedCategories.update(categoryId, { name });
      if (res.success) {
        toast.success("Category updated");
        setEditingCategoryId(null);
        setEditName("");
        await loadCategories();
      } else {
        toast.error(res.message || "Failed to update category");
      }
    } catch (error) {
      toast.error("Failed to update category");
    } finally {
      setUpdating(false);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, categoryId: number) => {
    if (e.key === "Enter") {
      handleUpdateCategory(categoryId);
    } else if (e.key === "Escape") {
      setEditingCategoryId(null);
      setEditName("");
    }
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setDeletingCategoryId(categoryToDelete.id);
    setShowDeleteConfirm(false);
    try {
      const res = await api.savedCategories.delete(categoryToDelete.id);
      if (res.success) {
        toast.success("Category deleted");
        await loadCategories();
      } else {
        toast.error(res.message || "Failed to delete category");
      }
    } catch (error) {
      toast.error("Failed to delete category");
    } finally {
      setDeletingCategoryId(null);
      setCategoryToDelete(null);
    }
  };

  const totalSaved = uncategorizedCount + categories.reduce((sum, cat) => sum + (cat.postCount || 0), 0);

  return (
    <div ref={rootRef} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={handleOpen}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="saved-posts-button"
        style={{
          color: "#E8C96A",
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          padding: "6px",
          borderRadius: "6px",
          WebkitTapHighlightColor: "transparent",
        }}
        aria-label="Saved Posts"
        aria-expanded={open}
      >
        <FiBookmark size={24} />
        {totalSaved > 0 && (
          <span className="saved-badge" style={{
            position: "absolute",
            top: "0px",
            right: "0px",
            backgroundColor: "#E8C96A",
            color: "#01050D",
            fontSize: "10px",
            fontWeight: 700,
            borderRadius: "10px",
            padding: "2px 5px",
            minWidth: "16px",
            textAlign: "center",
            pointerEvents: "none"
          }}>
            {totalSaved > 99 ? "99+" : totalSaved}
          </span>
        )}
        {showTooltip && (
          <span className="saved-tooltip" style={{
            position: "absolute",
            bottom: "-32px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "#1E2A47",
            color: "#FFF",
            fontSize: "12px",
            padding: "6px 10px",
            borderRadius: "6px",
            whiteSpace: "nowrap",
            pointerEvents: "none",
            zIndex: 100
          }}>
            Saved Posts
          </span>
        )}
      </button>

      <style jsx>{`
        @media (max-width: 640px) {
          .saved-posts-button :global(svg) {
            width: 20px !important;
            height: 20px !important;
          }
          .saved-badge {
            font-size: 8px !important;
            padding: 1px 4px !important;
            min-width: 14px !important;
          }
          .saved-tooltip {
            display: none !important;
          }
        }
      `}</style>

      {open && (
        <div className="saved-dropdown" style={{
          position: "fixed",
          top: "calc(clamp(50px, 6vw, 70px) + 8px)",
          right: "12px",
          width: "min(380px, calc(100vw - 24px))",
          maxHeight: "calc(100vh - clamp(50px, 6vw, 70px) - 24px)",
          overflowY: "auto",
          backgroundColor: "#13192A",
          border: "1px solid #1E2A47",
          borderRadius: "8px",
          zIndex: 50,
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          fontFamily: "var(--font-poppins), sans-serif",
        }}>
          <div className="saved-header" style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 18px",
            borderBottom: "1px solid #1E2A47",
            position: "sticky",
            top: 0,
            backgroundColor: "#13192A"
          }}>
            <div style={{ color: "#E8C96A", fontSize: "16px", fontWeight: 600 }}>Saved Posts</div>
          </div>

          {loading && categories.length === 0 && (
            <div style={{ padding: "24px", color: "#888", fontSize: "13px", textAlign: "center" }}>
              Loading…
            </div>
          )}

          {!loading && categories.length === 0 && uncategorizedCount === 0 && (
            <div style={{ padding: "32px 18px", color: "#888", fontSize: "13px", textAlign: "center" }}>
              No saved posts yet
            </div>
          )}

          {/* Uncategorized */}
          {uncategorizedCount > 0 && (
            <button
              onClick={() => handleCategoryClick("uncategorized")}
              style={{
                width: "100%",
                background: "none",
                border: "none",
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: "14px",
                cursor: "pointer",
                color: "#FFF",
                fontSize: "14px",
                transition: "background-color 0.2s",
                borderBottom: "1px solid rgba(255,255,255,0.05)"
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(232,201,106,0.1)"}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            >
              <FiBookmark size={18} color="#888" />
              <span style={{ flex: 1, textAlign: "left" }}>Uncategorized</span>
              <span style={{ color: "#888", fontSize: "12px" }}>{uncategorizedCount}</span>
            </button>
          )}

          {/* Categories */}
          {categories.map((cat) => (
            <div
              key={cat.id}
              style={{
                display: "flex",
                alignItems: "center",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                position: "relative",
                opacity: deletingCategoryId === cat.id ? 0.5 : 1,
                pointerEvents: deletingCategoryId === cat.id ? "none" : "auto",
              }}
            >
              {editingCategoryId === cat.id ? (
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", flexWrap: "wrap" }}>
                  <FiFolder size={18} color="#E8C96A" />
                  <input
                    autoFocus
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => handleEditKeyDown(e, cat.id)}
                    disabled={updating}
                    style={{
                      flex: 1,
                      minWidth: "0",
                      backgroundColor: "#060D1F",
                      border: "1px solid #1E2A47",
                      borderRadius: "6px",
                      padding: "8px 10px",
                      color: "#FFF",
                      fontSize: "13px",
                      outline: "none"
                    }}
                    maxLength={50}
                  />
                  <button
                    onClick={() => handleUpdateCategory(cat.id)}
                    disabled={updating || !editName.trim()}
                    style={{
                      backgroundColor: "#E8C96A",
                      color: "#01050D",
                      border: "none",
                      borderRadius: "6px",
                      padding: "8px 12px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: updating || !editName.trim() ? "not-allowed" : "pointer",
                      opacity: updating || !editName.trim() ? 0.5 : 1,
                      whiteSpace: "nowrap",
                      flexShrink: 0
                    }}
                  >
                    {updating ? "..." : "Save"}
                  </button>
                  <button
                    onClick={() => {
                      setEditingCategoryId(null);
                      setEditName("");
                    }}
                    disabled={updating}
                    style={{
                      backgroundColor: "transparent",
                      color: "#888",
                      border: "1px solid #1E2A47",
                      borderRadius: "6px",
                      padding: "8px 12px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: updating ? "not-allowed" : "pointer",
                      whiteSpace: "nowrap",
                      flexShrink: 0
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => handleCategoryClick(cat.id)}
                    style={{
                      flex: 1,
                      background: "none",
                      border: "none",
                      padding: "14px 18px",
                      display: "flex",
                      alignItems: "center",
                      gap: "14px",
                      cursor: "pointer",
                      color: "#FFF",
                      fontSize: "14px",
                      transition: "background-color 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(232,201,106,0.1)"}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                  >
                    <FiFolder size={18} color="#E8C96A" />
                    <span style={{ flex: 1, textAlign: "left", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {cat.name}
                    </span>
                    <span style={{ color: "#888", fontSize: "12px" }}>{cat.postCount || 0}</span>
                  </button>
                  <button
                    onClick={(e) => handleEditClick(e, cat)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: "14px 12px",
                      cursor: "pointer",
                      color: "#888",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.color = "#E8C96A"}
                    onMouseLeave={(e) => e.currentTarget.style.color = "#888"}
                  >
                    <FiEdit2 size={15} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteClick(e, cat)}
                    disabled={deletingCategoryId === cat.id}
                    style={{
                      background: "none",
                      border: "none",
                      padding: "14px 16px",
                      cursor: deletingCategoryId === cat.id ? "not-allowed" : "pointer",
                      color: "#888",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (deletingCategoryId !== cat.id) {
                        e.currentTarget.style.color = "#EF4444";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = "#888";
                    }}
                  >
                    <FiTrash2 size={15} />
                  </button>
                </>
              )}
            </div>
          ))}

          {/* Create Category */}
          <div style={{ padding: "10px", borderTop: "1px solid #1E2A47" }}>
            {!showCreateInput ? (
              <button
                onClick={() => setShowCreateInput(true)}
                style={{
                  width: "100%",
                  background: "none",
                  border: "1px solid #1E2A47",
                  borderRadius: "6px",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  color: "#E8C96A",
                  fontSize: "14px",
                  fontWeight: 500,
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "rgba(232,201,106,0.1)";
                  e.currentTarget.style.borderColor = "#E8C96A";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.borderColor = "#1E2A47";
                }}
              >
                <FiPlus size={18} />
                <span>Create Category</span>
              </button>
            ) : (
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  ref={inputRef}
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Category name"
                  disabled={creating}
                  style={{
                    flex: 1,
                    backgroundColor: "#060D1F",
                    border: "1px solid #1E2A47",
                    borderRadius: "6px",
                    padding: "10px 12px",
                    color: "#FFF",
                    fontSize: "13px",
                    outline: "none"
                  }}
                  maxLength={50}
                />
                <button
                  onClick={handleCreateCategory}
                  disabled={creating || !newCategoryName.trim()}
                  style={{
                    backgroundColor: "#E8C96A",
                    color: "#01050D",
                    border: "none",
                    borderRadius: "6px",
                    padding: "10px 14px",
                    fontSize: "13px",
                    fontWeight: 600,
                    cursor: creating || !newCategoryName.trim() ? "not-allowed" : "pointer",
                    opacity: creating || !newCategoryName.trim() ? 0.5 : 1,
                    whiteSpace: "nowrap"
                  }}
                >
                  {creating ? "..." : "Add"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && categoryToDelete && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "20px",
          }}
          onClick={() => {
            setShowDeleteConfirm(false);
            setCategoryToDelete(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: "#13192A",
              borderRadius: "12px",
              padding: "24px",
              maxWidth: "400px",
              width: "100%",
              border: "1px solid #1E2A47",
            }}
          >
            <div style={{ color: "#FFF", fontSize: "18px", fontWeight: 600, marginBottom: "12px" }}>
              Delete Category
            </div>
            <div style={{ color: "#888", fontSize: "14px", lineHeight: "1.6", marginBottom: "8px" }}>
              Delete "{categoryToDelete.name}"?
            </div>
            <div style={{ color: "#666", fontSize: "13px", lineHeight: "1.6", marginBottom: "24px" }}>
              Saved posts in this category will be moved to Uncategorized.
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setCategoryToDelete(null);
                }}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "transparent",
                  color: "#888",
                  border: "1px solid #1E2A47",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#E8C96A";
                  e.currentTarget.style.color = "#E8C96A";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#1E2A47";
                  e.currentTarget.style.color = "#888";
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteCategory}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#EF4444",
                  color: "#FFF",
                  border: "none",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#DC2626";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#EF4444";
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @media (max-width: 768px) {
          .saved-dropdown {
            width: calc(100vw - 20px) !important;
            right: 10px !important;
          }
        }
        @media (max-width: 480px) {
          .saved-dropdown {
            width: calc(100vw - 16px) !important;
            right: 8px !important;
          }
          .saved-header {
            padding: 12px 14px !important;
          }
          .saved-header > div {
            font-size: 14px !important;
          }
        }
      `}</style>
    </div>
  );
}
