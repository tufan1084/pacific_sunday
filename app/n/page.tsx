"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/app/services/api";
import { useAuth } from "@/app/context/AuthContext";
import { getData } from "country-list";

interface BagInfo {
  uid: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  collection: string | null;
}

type FlowState =
  | { step: "loading" }
  | { step: "error"; message: string }
  | { step: "register"; bag: BagInfo }
  | { step: "login"; bag: BagInfo }
  | { step: "submitting" };

/* ── Reusable input style ─────────────────────────────── */
const inputClass =
  "w-full rounded-md bg-[#13192A] text-white placeholder-[#64748B] outline-none transition-all focus:ring-2 focus:ring-[#E8C96A]/30 border border-white/10";

export default function NFCEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; c?: string; d?: string }>;
}) {
  const { e, c, d } = use(searchParams);
  const router = useRouter();
  const { login, register } = useAuth();

  const countries = getData();

  const [flow, setFlow] = useState<FlowState>({ step: "loading" });
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Register form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Field validation states
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [countryError, setCountryError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [loginEmailError, setLoginEmailError] = useState("");
  const [loginPasswordError, setLoginPasswordError] = useState("");

  // Password strength
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, text: "", color: "" });

  // Keep bag data when returning from submitting state
  const [savedBag, setSavedBag] = useState<BagInfo | null>(null);

  useEffect(() => {
    if (!e) {
      setFlow({ step: "error", message: "Invalid NFC tap. Missing parameters." });
      return;
    }

    let cancelled = false;

    async function checkBag() {
      try {
        const res = await api.bag.check(e!, c, d);
        if (cancelled) return;

        if (!res.success) {
          setFlow({ step: "error", message: res.message || "NFC validation failed." });
          return;
        }

        const data = res.data as { status: string; bag: BagInfo };
        const bag = data.bag;
        setSavedBag(bag);

        if (data.status === "new_user") {
          setFlow({ step: "register", bag });
        } else if (data.status === "existing_user") {
          setFlow({ step: "login", bag });
        } else {
          setFlow({ step: "error", message: "Unexpected response from server." });
        }
      } catch {
        if (!cancelled) {
          setFlow({ step: "error", message: "Could not connect to server. Please try again." });
        }
      }
    }

    checkBag();
    return () => { cancelled = true; };
  }, [e, c, d]);

  // Validation functions
  const validateName = (value: string) => {
    if (!value.trim()) return "Name is required";
    if (value.trim().length < 2) return "Name must be at least 2 characters";
    if (value.trim().length > 100) return "Name must be less than 100 characters";
    return "";
  };

  const validateEmail = (value: string) => {
    if (!value.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Please enter a valid email address";
    return "";
  };

  const validatePassword = (value: string) => {
    if (!value) return "Password is required";
    if (value.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(value)) return "Must contain at least 1 uppercase letter";
    if (!/[a-z]/.test(value)) return "Must contain at least 1 lowercase letter";
    if (!/[0-9]/.test(value)) return "Must contain at least 1 number";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return "Must contain at least 1 special character";
    return "";
  };

  const calculatePasswordStrength = (value: string) => {
    let score = 0;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[a-z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(value)) score++;

    if (score <= 2) return { score, text: "Weak", color: "#EF4444" };
    if (score <= 4) return { score, text: "Medium", color: "#F59E0B" };
    return { score, text: "Strong", color: "#10B981" };
  };

  // Input sanitization functions
  const sanitizeName = (value: string) => {
    let sanitized = value.replace(/[^a-zA-Z\s'-]/g, '');
    if (sanitized.length === 1 && sanitized === ' ') return '';
    return sanitized;
  };

  const sanitizeEmail = (value: string) => {
    let sanitized = value.replace(/[^a-zA-Z0-9@._-]/g, '').toLowerCase();
    if (sanitized.length === 1 && !/[a-z0-9]/.test(sanitized)) return '';
    return sanitized;
  };

  const sanitizePassword = (value: string) => {
    if (value.length === 1 && value === ' ') return '';
    return value.replace(/\s/g, '');
  };

  const handleRegister = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError("");

    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const countryErr = !country ? "Country is required" : "";
    const passwordErr = validatePassword(password);
    const confirmErr = password !== confirmPassword ? "Passwords do not match" : "";

    setNameError(nameErr);
    setEmailError(emailErr);
    setCountryError(countryErr);
    setPasswordError(passwordErr);
    setConfirmPasswordError(confirmErr);

    if (nameErr || emailErr || countryErr || passwordErr || confirmErr) return;
    if (flow.step !== "register") return;

    const bagUid = flow.bag.uid;
    setFlow({ step: "submitting" });

    const res = await register({ name, email, password, bagUid, country });

    if (res.success) {
      router.push("/profile");
    } else {
      setFormError(res.message || "Registration failed.");
      if (savedBag) setFlow({ step: "register", bag: savedBag });
    }
  };

  const handleLogin = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError("");

    const emailErr = validateEmail(loginEmail);
    const passwordErr = !loginPassword ? "Password is required" : "";

    setLoginEmailError(emailErr);
    setLoginPasswordError(passwordErr);

    if (emailErr || passwordErr) return;
    if (flow.step !== "login") return;

    setFlow({ step: "submitting" });

    const res = await login(loginEmail, loginPassword);

    if (res.success) {
      router.push("/");
    } else {
      setFormError(res.message || "Invalid email or password.");
      if (savedBag) setFlow({ step: "login", bag: savedBag });
    }
  };

  /* ── Eye toggle icon ────────────────────────────────── */
  const EyeToggle = ({ show, onToggle }: { show: boolean; onToggle: () => void }) => (
    <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#526080] transition-colors hover:text-[#94A3B8]">
      {show ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  );

  /* ── NFC chip icon ──────────────────────────────────── */
  const NFCIcon = () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E6C36A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8.32a7.43 7.43 0 010 7.36" />
      <path d="M9.46 6.21a11.76 11.76 0 010 11.58" />
      <path d="M12.91 4.1a16.07 16.07 0 010 15.8" />
      <path d="M16.37 2a20.4 20.4 0 010 20" />
    </svg>
  );

  /* ── Bag Card (shown in register & login) ─────────── */
  const BagCard = ({ bag }: { bag: BagInfo }) => (
    <div className="flex items-center gap-4 rounded-lg" style={{ backgroundColor: "rgba(232, 201, 106, 0.05)", border: "1px solid rgba(232, 201, 106, 0.1)", padding: "14px 16px", marginBottom: "20px" }}>
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg" style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "#0b1326" }}>
        {bag.imageUrl ? (
          <img src={bag.imageUrl} alt={bag.name} className="h-full w-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-white/40">No img</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-[#E8C96A]" style={{ fontSize: "clamp(13px, 1.5vw, 15px)", fontFamily: "var(--font-poppins), sans-serif" }}>{bag.name}</div>
        {bag.collection && (
          <div className="truncate text-white/50" style={{ fontSize: "clamp(11px, 1.2vw, 13px)", fontFamily: "var(--font-poppins), sans-serif" }}>{bag.collection}</div>
        )}
        <div className="truncate font-mono text-white/30" style={{ fontSize: "10px" }}>{bag.uid}</div>
      </div>
    </div>
  );

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center"
      style={{
        background: "linear-gradient(180deg, #020617 0%, #020617 40%, #030b1f 100%)",
        padding: "16px",
      }}
    >
      {/* ── Container ── */}
      <div className="nfc-container w-full">
        {/* Logo */}
        <div className="mb-6 flex justify-center sm:mb-8">
          <Image src="/logo.png" alt="Pacific Sunday" width={160} height={44} priority className="nfc-logo" />
        </div>

        {/* ── Loading State ── */}
        {flow.step === "loading" && (
          <div className="nfc-card rounded-lg text-center" style={{ backgroundColor: "#13192A", padding: "50px 30px" }}>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "rgba(232, 201, 106, 0.1)" }}>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8C96A]/20 border-t-[#E8C96A]" />
            </div>
            <h2 className="mb-3 font-semibold text-white" style={{ fontSize: "clamp(16px, 2vw, 20px)", fontFamily: "var(--font-poppins), sans-serif" }}>Verifying NFC Tap</h2>
            <p className="text-[#94A3B8]" style={{ fontSize: "clamp(13px, 1.5vw, 15px)", fontFamily: "var(--font-poppins), sans-serif" }}>Authenticating your bag with the server...</p>
          </div>
        )}

        {/* ── Submitting State ── */}
        {flow.step === "submitting" && (
          <div className="nfc-card rounded-lg text-center" style={{ backgroundColor: "#13192A", padding: "50px 30px" }}>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full" style={{ backgroundColor: "rgba(232, 201, 106, 0.1)" }}>
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E8C96A]/20 border-t-[#E8C96A]" />
            </div>
            <h2 className="mb-3 font-semibold text-white" style={{ fontSize: "clamp(16px, 2vw, 20px)", fontFamily: "var(--font-poppins), sans-serif" }}>Processing</h2>
            <p className="text-[#94A3B8]" style={{ fontSize: "clamp(13px, 1.5vw, 15px)", fontFamily: "var(--font-poppins), sans-serif" }}>Setting up your account...</p>
          </div>
        )}

        {/* ── Error State ── */}
        {flow.step === "error" && (
          <div className="nfc-card overflow-hidden rounded-lg" style={{ backgroundColor: "#13192A" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)", padding: "20px 24px" }}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M15 9l-6 6M9 9l6 6" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-semibold text-white" style={{ fontSize: "clamp(16px, 2vw, 20px)", fontFamily: "var(--font-poppins), sans-serif" }}>Verification Failed</h2>
                  <p className="mt-0.5 text-[#94A3B8]" style={{ fontSize: "clamp(12px, 1.3vw, 14px)", fontFamily: "var(--font-poppins), sans-serif" }}>
                    Unable to authenticate your bag
                  </p>
                </div>
              </div>
            </div>

            <div style={{ padding: "24px" }}>
              <div className="rounded-md" style={{ backgroundColor: "rgba(239, 68, 68, 0.05)", padding: "16px", border: "1px solid rgba(239, 68, 68, 0.1)", marginBottom: "20px" }}>
                <p className="text-[#F87171]" style={{ fontSize: "clamp(13px, 1.5vw, 15px)", fontFamily: "var(--font-poppins), sans-serif", lineHeight: "1.6" }}>
                  {flow.message}
                </p>
              </div>

              <div className="rounded-md" style={{ backgroundColor: "rgba(232, 201, 106, 0.05)", padding: "16px", border: "1px solid rgba(232, 201, 106, 0.1)" }}>
                <div className="flex items-start gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="1.5" strokeLinecap="round" className="mt-0.5 shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                  <div>
                    <p className="font-medium" style={{ fontSize: "clamp(13px, 1.5vw, 14px)", color: "#E8C96A", fontFamily: "var(--font-poppins), sans-serif", marginBottom: "8px" }}>What to do next:</p>
                    <ul className="text-[#94A3B8]" style={{ fontSize: "clamp(12px, 1.3vw, 14px)", fontFamily: "var(--font-poppins), sans-serif", lineHeight: "1.6", paddingLeft: "20px", margin: 0 }}>
                      <li style={{ marginBottom: "4px" }}>Ensure your bag&apos;s NFC chip is working properly</li>
                      <li style={{ marginBottom: "4px" }}>Try tapping your bag again</li>
                      <li>Contact support if the issue persists</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Register Form ── */}
        {flow.step === "register" && (
          <div className="nfc-card overflow-hidden rounded-lg" style={{ backgroundColor: "#13192A" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)", padding: "20px 24px" }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "rgba(232, 201, 106, 0.1)" }}>
                    <NFCIcon />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white" style={{ fontSize: "clamp(16px, 2vw, 20px)", fontFamily: "var(--font-poppins), sans-serif" }}>Create Your Account</h2>
                    <p className="mt-0.5 text-[#94A3B8]" style={{ fontSize: "clamp(12px, 1.3vw, 14px)", fontFamily: "var(--font-poppins), sans-serif" }}>
                      Register to link your bag
                    </p>
                  </div>
                </div>
                <span className="rounded-full text-emerald-400" style={{ fontSize: "10px", fontWeight: 500, backgroundColor: "rgba(52, 211, 153, 0.1)", fontFamily: "var(--font-poppins), sans-serif", padding: "4px 10px" }}>Verified</span>
              </div>
            </div>

            <form onSubmit={handleRegister} style={{ padding: "24px" }}>
              {/* Bag details card */}
              <BagCard bag={flow.bag} />

              {formError && (
                <div className="flex items-start gap-2 rounded-md bg-red-500/10" style={{ padding: "12px", marginBottom: "20px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0">
                    <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                  </svg>
                  <p className="text-xs text-red-400" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>{formError}</p>
                </div>
              )}

              {/* Name */}
              <div style={{ marginBottom: "20px" }}>
                <label className="block text-[#94A3B8]" style={{ fontSize: "clamp(12px, 1.3vw, 14px)", fontFamily: "var(--font-poppins), sans-serif", fontWeight: 400, marginBottom: "8px" }}>Full Name <span style={{ color: "#EF4444" }}>*</span></label>
                <input
                  type="text" required minLength={2} maxLength={100}
                  value={name}
                  onChange={(ev) => {
                    const sanitized = sanitizeName(ev.target.value);
                    setName(sanitized);
                    setNameError(validateName(sanitized));
                  }}
                  onBlur={(ev) => setNameError(validateName(ev.target.value))}
                  placeholder="John Doe"
                  className={`${inputClass} nfc-input ${nameError ? 'border-red-500/50' : ''}`}
                />
              </div>

              {/* Email */}
              <div style={{ marginBottom: "20px" }}>
                <label className="block text-[#94A3B8]" style={{ fontSize: "clamp(12px, 1.3vw, 14px)", fontFamily: "var(--font-poppins), sans-serif", fontWeight: 400, marginBottom: "8px" }}>Email Address <span style={{ color: "#EF4444" }}>*</span></label>
                <input
                  type="email" required
                  value={email}
                  onChange={(ev) => {
                    const sanitized = sanitizeEmail(ev.target.value);
                    setEmail(sanitized);
                    setEmailError(validateEmail(sanitized));
                  }}
                  onBlur={(ev) => setEmailError(validateEmail(ev.target.value))}
                  placeholder="john@example.com"
                  className={`${inputClass} nfc-input ${emailError ? 'border-red-500/50' : ''}`}
                />
              </div>

              {/* Country */}
              <div style={{ marginBottom: "20px" }}>
                <label className="block text-[#94A3B8]" style={{ fontSize: "clamp(12px, 1.3vw, 14px)", fontFamily: "var(--font-poppins), sans-serif", fontWeight: 400, marginBottom: "8px" }}>Country <span style={{ color: "#EF4444" }}>*</span></label>
                <select
                  required
                  value={country}
                  onChange={(ev) => {
                    setCountry(ev.target.value);
                    setCountryError(!ev.target.value ? "Country is required" : "");
                  }}
                  onBlur={(ev) => setCountryError(!ev.target.value ? "Country is required" : "")}
                  className={`${inputClass} nfc-input ${countryError ? 'border-red-500/50' : ''}`}
                  style={{ cursor: "pointer" }}
                >
                  <option value="" disabled>Select your country</option>
                  {countries.map((c) => (
                    <option key={c.code} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Password */}
              <div style={{ marginBottom: "20px" }}>
                <label className="block text-[#94A3B8]" style={{ fontSize: "clamp(12px, 1.3vw, 14px)", fontFamily: "var(--font-poppins), sans-serif", fontWeight: 400, marginBottom: "8px" }}>Password <span style={{ color: "#EF4444" }}>*</span></label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"} required minLength={8}
                    value={password}
                    onChange={(ev) => {
                      const sanitized = sanitizePassword(ev.target.value);
                      setPassword(sanitized);
                      setPasswordError(validatePassword(sanitized));
                      setPasswordStrength(calculatePasswordStrength(sanitized));
                      if (confirmPassword) {
                        setConfirmPasswordError(sanitized !== confirmPassword ? "Passwords do not match" : "");
                      }
                    }}
                    onBlur={(ev) => setPasswordError(validatePassword(ev.target.value))}
                    placeholder="Min 8 chars, uppercase, number, special char"
                    className={`${inputClass} nfc-input pr-10 ${passwordError ? 'border-red-500/50' : ''}`}
                  />
                  <EyeToggle show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
                </div>
                {password && !passwordError && (
                  <div className="flex items-center gap-2" style={{ marginTop: "8px" }}>
                    <div className="h-1 flex-1 rounded-full bg-white/10">
                      <div className="h-full rounded-full transition-all" style={{ width: `${(passwordStrength.score / 6) * 100}%`, backgroundColor: passwordStrength.color }} />
                    </div>
                    <span className="text-xs" style={{ color: passwordStrength.color, fontFamily: "var(--font-poppins), sans-serif" }}>{passwordStrength.text}</span>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div style={{ marginBottom: "20px" }}>
                <label className="block text-[#94A3B8]" style={{ fontSize: "clamp(12px, 1.3vw, 14px)", fontFamily: "var(--font-poppins), sans-serif", fontWeight: 400, marginBottom: "8px" }}>Confirm Password <span style={{ color: "#EF4444" }}>*</span></label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"} required
                    value={confirmPassword}
                    onChange={(ev) => {
                      const sanitized = sanitizePassword(ev.target.value);
                      setConfirmPassword(sanitized);
                      setConfirmPasswordError(password !== sanitized ? "Passwords do not match" : "");
                    }}
                    onBlur={(ev) => setConfirmPasswordError(password !== ev.target.value ? "Passwords do not match" : "")}
                    placeholder="Re-enter your password"
                    className={`${inputClass} nfc-input pr-10 ${confirmPasswordError ? 'border-red-500/50' : ''}`}
                  />
                  <EyeToggle show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="nfc-btn w-full rounded-md font-semibold text-black transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ backgroundColor: "#E8C96A", fontFamily: "var(--font-poppins), sans-serif", height: "44px" }}
              >
                Create Account & Link Bag
              </button>
            </form>
          </div>
        )}

        {/* ── Login Form ── */}
        {flow.step === "login" && (
          <div className="nfc-card overflow-hidden rounded-lg" style={{ backgroundColor: "#13192A" }}>
            <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.05)", padding: "20px 24px" }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: "rgba(232, 201, 106, 0.1)" }}>
                    <NFCIcon />
                  </div>
                  <div>
                    <h2 className="font-semibold text-white" style={{ fontSize: "clamp(16px, 2vw, 20px)", fontFamily: "var(--font-poppins), sans-serif" }}>Welcome Back</h2>
                    <p className="mt-0.5 text-[#94A3B8]" style={{ fontSize: "clamp(12px, 1.3vw, 14px)", fontFamily: "var(--font-poppins), sans-serif" }}>
                      Log in to access your account
                    </p>
                  </div>
                </div>
                <span className="rounded-full text-emerald-400" style={{ fontSize: "10px", fontWeight: 500, backgroundColor: "rgba(52, 211, 153, 0.1)", fontFamily: "var(--font-poppins), sans-serif", padding: "4px 10px" }}>Verified</span>
              </div>
            </div>

            <form onSubmit={handleLogin} style={{ padding: "24px" }}>
              {/* Bag details card */}
              <BagCard bag={flow.bag} />

              {formError && (
                <div className="flex items-start gap-2 rounded-md bg-red-500/10" style={{ padding: "12px", marginBottom: "20px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0">
                    <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                  </svg>
                  <p className="text-xs text-red-400" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>{formError}</p>
                </div>
              )}

              {/* Email */}
              <div style={{ marginBottom: "20px" }}>
                <label className="block text-[#94A3B8]" style={{ fontSize: "clamp(12px, 1.3vw, 14px)", fontFamily: "var(--font-poppins), sans-serif", fontWeight: 400, marginBottom: "8px" }}>Email Address <span style={{ color: "#EF4444" }}>*</span></label>
                <input
                  type="email" required
                  value={loginEmail}
                  onChange={(ev) => {
                    const sanitized = sanitizeEmail(ev.target.value);
                    setLoginEmail(sanitized);
                    setLoginEmailError(validateEmail(sanitized));
                  }}
                  onBlur={(ev) => setLoginEmailError(validateEmail(ev.target.value))}
                  placeholder="john@example.com"
                  className={`${inputClass} nfc-input ${loginEmailError ? 'border-red-500/50' : ''}`}
                />
              </div>

              {/* Password */}
              <div style={{ marginBottom: "24px" }}>
                <label className="block text-[#94A3B8]" style={{ fontSize: "clamp(12px, 1.3vw, 14px)", fontFamily: "var(--font-poppins), sans-serif", fontWeight: 400, marginBottom: "8px" }}>Password <span style={{ color: "#EF4444" }}>*</span></label>
                <div className="relative">
                  <input
                    type={showLoginPassword ? "text" : "password"} required
                    value={loginPassword}
                    onChange={(ev) => {
                      const sanitized = sanitizePassword(ev.target.value);
                      setLoginPassword(sanitized);
                      setLoginPasswordError(!sanitized ? "Password is required" : "");
                    }}
                    onBlur={(ev) => setLoginPasswordError(!ev.target.value ? "Password is required" : "")}
                    placeholder="Enter your password"
                    className={`${inputClass} nfc-input pr-10 ${loginPasswordError ? 'border-red-500/50' : ''}`}
                  />
                  <EyeToggle show={showLoginPassword} onToggle={() => setShowLoginPassword(!showLoginPassword)} />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="nfc-btn w-full rounded-md font-semibold text-black transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ backgroundColor: "#E8C96A", fontFamily: "var(--font-poppins), sans-serif", height: "44px" }}
              >
                Log In
              </button>
            </form>
          </div>
        )}

        {/* Footer */}
        <p className="mt-5 text-center text-[11px] text-[#3a4560] sm:mt-6">
          Pacific Sunday 2026 &mdash; NFC-Powered Digital Ownership
        </p>
      </div>
    </div>
  );
}
