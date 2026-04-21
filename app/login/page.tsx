"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import { api } from "@/app/services/api";

type ForgotStep = "none" | "email" | "otp" | "reset" | "done";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password state
  const [forgotStep, setForgotStep] = useState<ForgotStep>("none");
  const [forgotEmail, setForgotEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await login(form.email, form.password);
      if (result.success) {
        router.push("/");
      } else {
        setError(result.message || "Invalid email or password");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Login failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const openForgot = () => {
    setForgotStep("email");
    setForgotEmail(form.email || "");
    setOtp("");
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setForgotError("");
  };

  const closeForgot = () => {
    setForgotStep("none");
    setForgotError("");
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);
    try {
      const res = await api.auth.forgotPassword(forgotEmail);
      if (res.success) {
        showToast("If that email is registered, a code has been sent.", "success");
        setForgotStep("otp");
      } else {
        setForgotError(res.message || "Unable to send code.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Request failed.";
      setForgotError(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);
    try {
      const res = await api.auth.verifyOtp(forgotEmail, otp);
      if (res.success && res.data?.resetToken) {
        setResetToken(res.data.resetToken);
        setForgotStep("reset");
      } else {
        setForgotError(res.message || "Invalid code.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Request failed.";
      setForgotError(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");

    if (newPassword !== confirmPassword) {
      setForgotError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setForgotError("Password must be at least 8 characters.");
      return;
    }
    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setForgotError("Password must contain an uppercase letter and a number.");
      return;
    }

    setForgotLoading(true);
    try {
      const res = await api.auth.resetPassword(resetToken, newPassword);
      if (res.success) {
        setForgotStep("done");
        showToast("Password reset successfully. Please sign in.", "success");
      } else {
        setForgotError(res.message || "Unable to reset password.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Request failed.";
      setForgotError(msg);
    } finally {
      setForgotLoading(false);
    }
  };

  const inputStyle = {
    width: "100%",
    backgroundColor: "#182037",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "5px",
    color: "#FFFFFF",
    fontSize: "14px",
    padding: "12px",
    outline: "none",
    fontFamily: "inherit",
  } as const;

  const primaryBtnStyle = (disabled: boolean) => ({
    width: "100%",
    backgroundColor: "#E8C96A",
    color: "#060D1F",
    border: "none",
    borderRadius: "5px",
    padding: "14px",
    fontSize: "16px",
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.6 : 1,
    fontFamily: "inherit",
  });

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
              style={inputStyle}
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
                style={{ ...inputStyle, paddingRight: "40px" }}
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
              <button
                type="button"
                onClick={openForgot}
                style={{ color: "#E8C96A", fontSize: "13px", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" }}
              >
                Forgot Password?
              </button>
            </div>
          </div>

          {error && (
            <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "5px", padding: "12px", marginBottom: "20px" }}>
              <p style={{ color: "#EF4444", fontSize: "14px", margin: 0 }}>{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading} style={primaryBtnStyle(loading)}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>

      {forgotStep !== "none" && (
        <div
          onClick={closeForgot}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            zIndex: 50,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: "440px",
              backgroundColor: "#13192A",
              borderRadius: "8px",
              padding: "32px",
              fontFamily: "var(--font-poppins), sans-serif",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <h2 style={{ color: "#E8C96A", fontSize: "22px", fontWeight: 500, margin: 0 }}>
                {forgotStep === "email" && "Reset Password"}
                {forgotStep === "otp" && "Enter Code"}
                {forgotStep === "reset" && "New Password"}
                {forgotStep === "done" && "Password Updated"}
              </h2>
              <button
                onClick={closeForgot}
                style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: "20px", padding: "4px" }}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            {forgotStep === "email" && (
              <form onSubmit={handleRequestOtp}>
                <p style={{ color: "#94A3B8", fontSize: "14px", marginBottom: "20px" }}>
                  Enter your email and we&apos;ll send you a 6-digit verification code.
                </p>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", display: "block", marginBottom: "8px" }}>Email</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    autoFocus
                    style={inputStyle}
                  />
                </div>
                {forgotError && (
                  <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "5px", padding: "12px", marginBottom: "16px" }}>
                    <p style={{ color: "#EF4444", fontSize: "14px", margin: 0 }}>{forgotError}</p>
                  </div>
                )}
                <button type="submit" disabled={forgotLoading} style={primaryBtnStyle(forgotLoading)}>
                  {forgotLoading ? "Sending..." : "Send Code"}
                </button>
              </form>
            )}

            {forgotStep === "otp" && (
              <form onSubmit={handleVerifyOtp}>
                <p style={{ color: "#94A3B8", fontSize: "14px", marginBottom: "20px" }}>
                  We sent a 6-digit code to <span style={{ color: "#fff" }}>{forgotEmail}</span>. It expires in 10 minutes.
                </p>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", display: "block", marginBottom: "8px" }}>Verification code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    autoFocus
                    style={{ ...inputStyle, letterSpacing: "8px", textAlign: "center", fontSize: "20px", fontWeight: 600 }}
                  />
                </div>
                {forgotError && (
                  <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "5px", padding: "12px", marginBottom: "16px" }}>
                    <p style={{ color: "#EF4444", fontSize: "14px", margin: 0 }}>{forgotError}</p>
                  </div>
                )}
                <button type="submit" disabled={forgotLoading || otp.length !== 6} style={primaryBtnStyle(forgotLoading || otp.length !== 6)}>
                  {forgotLoading ? "Verifying..." : "Verify Code"}
                </button>
                <div style={{ textAlign: "center", marginTop: "12px" }}>
                  <button
                    type="button"
                    onClick={() => setForgotStep("email")}
                    style={{ color: "#E8C96A", fontSize: "13px", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" }}
                  >
                    Didn&apos;t receive the code? Try again
                  </button>
                </div>
              </form>
            )}

            {forgotStep === "reset" && (
              <form onSubmit={handleResetPassword}>
                <p style={{ color: "#94A3B8", fontSize: "14px", marginBottom: "20px" }}>
                  Choose a new password. Must be at least 8 characters, with an uppercase letter and a number.
                </p>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", display: "block", marginBottom: "8px" }}>New password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    autoFocus
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "14px", display: "block", marginBottom: "8px" }}>Confirm password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={inputStyle}
                  />
                </div>
                {forgotError && (
                  <div style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "5px", padding: "12px", marginBottom: "16px" }}>
                    <p style={{ color: "#EF4444", fontSize: "14px", margin: 0 }}>{forgotError}</p>
                  </div>
                )}
                <button type="submit" disabled={forgotLoading} style={primaryBtnStyle(forgotLoading)}>
                  {forgotLoading ? "Updating..." : "Update Password"}
                </button>
              </form>
            )}

            {forgotStep === "done" && (
              <div>
                <p style={{ color: "#94A3B8", fontSize: "14px", marginBottom: "20px" }}>
                  Your password has been updated. You can now sign in with the new password.
                </p>
                <button
                  type="button"
                  onClick={closeForgot}
                  style={primaryBtnStyle(false)}
                >
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
