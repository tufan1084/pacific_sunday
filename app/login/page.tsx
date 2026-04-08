"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(form.email, form.password);
      router.push("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#060D1F", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: "500px", backgroundColor: "#13192A", borderRadius: "8px", padding: "40px", fontFamily: "var(--font-poppins), sans-serif" }}>
        <h1 style={{ color: "#E8C96A", fontSize: "28px", fontWeight: 500, marginBottom: "8px", textAlign: "center" }}>Welcome Back</h1>
        <p style={{ color: "#94A3B8", fontSize: "14px", marginBottom: "32px", textAlign: "center" }}>Sign in to your account</p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", display: "block", marginBottom: "8px" }}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              style={{ width: "100%", backgroundColor: "#182037", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "5px", color: "#FFFFFF", fontSize: "14px", padding: "12px", outline: "none" }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", display: "block", marginBottom: "8px" }}>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                style={{ width: "100%", backgroundColor: "#182037", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "5px", color: "#FFFFFF", fontSize: "14px", padding: "12px", paddingRight: "40px", outline: "none" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: "4px", display: "flex", alignItems: "center" }}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            <div style={{ textAlign: "right", marginTop: "8px" }}>
              <Link href="/forgot-password" style={{ color: "#E8C96A", fontSize: "13px", textDecoration: "none" }}>
                Forgot Password?
              </Link>
            </div>
          </div>

          {error && (
            <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "5px", padding: "12px", marginBottom: "20px" }}>
              <p style={{ color: "#EF4444", fontSize: "14px", margin: 0 }}>{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: "100%", backgroundColor: "#E8C96A", color: "#060D1F", border: "none", borderRadius: "5px", padding: "14px", fontSize: "16px", fontWeight: 500, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1 }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
