"use client";

import { useState, useEffect } from "react";
import { api } from "@/app/services/api";
import { useToast } from "@/app/context/ToastContext";

interface PointsRange {
  id: number;
  name: string;
  minScore: number;
  maxScore: number;
  points: number;
  isActive: boolean;
  sortOrder: number;
}

export default function PointSystemPage() {
  const { showToast } = useToast();
  const [ranges, setRanges] = useState<PointsRange[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  
  const [name, setName] = useState("");
  const [minScore, setMinScore] = useState("");
  const [maxScore, setMaxScore] = useState("");
  const [points, setPoints] = useState("");
  const [sortOrder, setSortOrder] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadRanges();
  }, []);

  const loadRanges = async () => {
    setLoading(true);
    try {
      const res = await api.points.getRanges();
      if (res.success && res.data) {
        setRanges((res.data as any).ranges || []);
      }
    } catch (error) {
      showToast("Failed to load points ranges", "error");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setMinScore("");
    setMaxScore("");
    setPoints("");
    setSortOrder("");
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (range: PointsRange) => {
    setName(range.name);
    setMinScore(String(range.minScore));
    setMaxScore(String(range.maxScore));
    setPoints(String(range.points));
    setSortOrder(String(range.sortOrder));
    setEditingId(range.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !minScore || !maxScore || !points) {
      showToast("Please fill all required fields", "error");
      return;
    }

    const minScoreNum = parseInt(minScore);
    const maxScoreNum = parseInt(maxScore);
    
    if (minScoreNum > maxScoreNum) {
      showToast("Min score must be less than or equal to max score", "error");
      return;
    }

    setSubmitting(true);
    try {
      const data = {
        name: name.trim(),
        minScore: minScoreNum,
        maxScore: maxScoreNum,
        points: parseInt(points),
        sortOrder: sortOrder ? parseInt(sortOrder) : 0,
      };

      if (editingId) {
        const res = await api.points.updateRange(editingId, data);
        if (res.success) {
          showToast("Points range updated", "success");
          loadRanges();
          resetForm();
        } else {
          showToast(res.message || "Failed to update", "error");
        }
      } else {
        const res = await api.points.createRange(data);
        if (res.success) {
          showToast("Points range created", "success");
          loadRanges();
          resetForm();
        } else {
          showToast(res.message || "Failed to create", "error");
        }
      }
    } catch (error) {
      showToast("An error occurred", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this points range?")) return;
    
    try {
      const res = await api.points.deleteRange(id);
      if (res.success) {
        showToast("Points range deleted", "success");
        loadRanges();
      } else {
        showToast(res.message || "Failed to delete", "error");
      }
    } catch (error) {
      showToast("An error occurred", "error");
    }
  };

  const handleToggleActive = async (range: PointsRange) => {
    try {
      const res = await api.points.updateRange(range.id, { isActive: !range.isActive });
      if (res.success) {
        showToast(range.isActive ? "Range deactivated" : "Range activated", "success");
        loadRanges();
      } else {
        showToast(res.message || "Failed to update", "error");
      }
    } catch (error) {
      showToast("An error occurred", "error");
    }
  };

  return (
    <div style={{ fontFamily: "var(--font-poppins), sans-serif" }}>
      <div style={{ marginBottom: "clamp(16px, 3vw, 24px)" }}>
        <div
          className="tracking-wide"
          style={{
            fontSize: "clamp(16px, 3vw, 25px)",
            color: "#E8C96A",
            fontWeight: 400,
          }}
        >
          Point System
        </div>
        <div
          style={{
            fontSize: "clamp(12px, 1.8vw, 16px)",
            color: "#FFFFFF",
            fontWeight: 400,
            marginTop: "4px",
          }}
        >
          Configure points ranges based on player scores
        </div>
      </div>

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          style={{
            backgroundColor: "#E8C96A",
            color: "#060D1F",
            border: "none",
            borderRadius: "5px",
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            marginBottom: "16px",
          }}
        >
          + Add Points Range
        </button>
      )}

      {showForm && (
        <div
          style={{
            backgroundColor: "#13192A",
            borderRadius: "5px",
            padding: "20px",
            marginBottom: "16px",
          }}
        >
          <div style={{ fontSize: "16px", color: "#E8C96A", fontWeight: 600, marginBottom: "16px" }}>
            {editingId ? "Edit Points Range" : "Add New Points Range"}
          </div>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "16px" }}>
              <div>
                <label style={{ color: "#FFF", fontSize: "12px", display: "block", marginBottom: "6px" }}>
                  Name <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Excellent"
                  style={{
                    width: "100%",
                    backgroundColor: "#060D1F",
                    border: "1px solid #1E2A47",
                    borderRadius: "5px",
                    padding: "8px",
                    color: "#FFF",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ color: "#FFF", fontSize: "12px", display: "block", marginBottom: "6px" }}>
                  Min Score <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="number"
                  value={minScore}
                  onChange={(e) => setMinScore(e.target.value)}
                  placeholder="e.g., -20"
                  style={{
                    width: "100%",
                    backgroundColor: "#060D1F",
                    border: "1px solid #1E2A47",
                    borderRadius: "5px",
                    padding: "8px",
                    color: "#FFF",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ color: "#FFF", fontSize: "12px", display: "block", marginBottom: "6px" }}>
                  Max Score <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="number"
                  value={maxScore}
                  onChange={(e) => setMaxScore(e.target.value)}
                  placeholder="e.g., -15"
                  style={{
                    width: "100%",
                    backgroundColor: "#060D1F",
                    border: "1px solid #1E2A47",
                    borderRadius: "5px",
                    padding: "8px",
                    color: "#FFF",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ color: "#FFF", fontSize: "12px", display: "block", marginBottom: "6px" }}>
                  Points <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input
                  type="number"
                  value={points}
                  onChange={(e) => setPoints(e.target.value)}
                  placeholder="e.g., 100"
                  style={{
                    width: "100%",
                    backgroundColor: "#060D1F",
                    border: "1px solid #1E2A47",
                    borderRadius: "5px",
                    padding: "8px",
                    color: "#FFF",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ color: "#FFF", fontSize: "12px", display: "block", marginBottom: "6px" }}>
                  Sort Order
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                  placeholder="0"
                  style={{
                    width: "100%",
                    backgroundColor: "#060D1F",
                    border: "1px solid #1E2A47",
                    borderRadius: "5px",
                    padding: "8px",
                    color: "#FFF",
                    fontSize: "13px",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  backgroundColor: "#E8C96A",
                  color: "#060D1F",
                  border: "none",
                  borderRadius: "5px",
                  padding: "10px 20px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: submitting ? "not-allowed" : "pointer",
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? "Saving..." : editingId ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                style={{
                  backgroundColor: "transparent",
                  color: "#888",
                  border: "1px solid #1E2A47",
                  borderRadius: "5px",
                  padding: "10px 20px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div
        style={{
          backgroundColor: "#13192A",
          borderRadius: "5px",
          overflow: "hidden",
        }}
      >
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>
            Loading...
          </div>
        ) : ranges.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "rgba(255,255,255,0.4)", fontSize: "14px" }}>
            No points ranges configured yet
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "rgba(255,255,255,0.05)", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "rgba(255,255,255,0.6)", fontSize: "12px", fontWeight: 600 }}>
                    Name
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: "12px", fontWeight: 600 }}>
                    Score Range
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: "12px", fontWeight: 600 }}>
                    Points
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: "12px", fontWeight: 600 }}>
                    Status
                  </th>
                  <th style={{ padding: "12px 16px", textAlign: "center", color: "rgba(255,255,255,0.6)", fontSize: "12px", fontWeight: 600 }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {ranges.map((range, idx) => (
                  <tr
                    key={range.id}
                    style={{
                      borderBottom: idx < ranges.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      opacity: range.isActive ? 1 : 0.5,
                    }}
                  >
                    <td style={{ padding: "12px 16px", color: "#FFF", fontSize: "14px", fontWeight: 500 }}>
                      {range.name}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center", color: "#E8C96A", fontSize: "14px", fontWeight: 600 }}>
                      {range.minScore} to {range.maxScore}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center", color: "#4ADE80", fontSize: "14px", fontWeight: 600 }}>
                      {range.points} pts
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <button
                        onClick={() => handleToggleActive(range)}
                        style={{
                          backgroundColor: range.isActive ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.1)",
                          color: range.isActive ? "#4ADE80" : "#888",
                          border: "none",
                          borderRadius: "4px",
                          padding: "4px 12px",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        {range.isActive ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                        <button
                          onClick={() => handleEdit(range)}
                          style={{
                            backgroundColor: "rgba(232,201,106,0.2)",
                            color: "#E8C96A",
                            border: "none",
                            borderRadius: "4px",
                            padding: "6px 12px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(range.id)}
                          style={{
                            backgroundColor: "rgba(239,68,68,0.2)",
                            color: "#EF4444",
                            border: "none",
                            borderRadius: "4px",
                            padding: "6px 12px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: "16px",
          backgroundColor: "rgba(232,201,106,0.1)",
          border: "1px solid rgba(232,201,106,0.3)",
          borderRadius: "5px",
          padding: "16px",
        }}
      >
        <div style={{ fontSize: "13px", color: "#E8C96A", fontWeight: 600, marginBottom: "8px" }}>
          How it works:
        </div>
        <ul style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", lineHeight: "1.6", margin: 0, paddingLeft: "20px" }}>
          <li>Define score ranges (e.g., -20 to -15) and assign points</li>
          <li>Users pick 5 players from different tiers</li>
          <li>After tournament completion, each player's final score is matched to a range</li>
          <li>Total points are calculated and credited to user's wallet</li>
          <li>Use negative numbers for under par (e.g., -18), positive for over par (e.g., +5)</li>
        </ul>
      </div>
    </div>
  );
}
