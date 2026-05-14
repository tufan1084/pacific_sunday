"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Script from "next/script";
import { api } from "@/app/services/api";
import { useAuth } from "@/app/context/AuthContext";
import { useToast } from "@/app/context/ToastContext";
import { getData } from "country-list";

interface BagInfo {
  uid: string;
  tokenId?: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  collection: string | null;
}

interface NfcAuthContext {
  nfcToken: string;
  maskedEmail: string;
  username: string | null;
}

type FlowState =
  | { step: "loading" }
  | { step: "error"; message: string }
  | { step: "register"; bag: BagInfo }
  | { step: "login"; bag: BagInfo; auth: NfcAuthContext }
  | { step: "device-otp"; bag: BagInfo; challengeId: number; email: string; deviceLabel?: string; otp?: string }
  | { step: "submitting" };

/* ── Reusable input style ─────────────────────────────── */
const inputClass =
  "w-full rounded-md bg-[#13192A] text-white placeholder-[#64748B] outline-none transition-all focus:ring-2 focus:ring-[#E8C96A]/30 border border-white/10";

export default function NFCEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ iykRef?: string }>;
}) {
  const { iykRef } = use(searchParams);
  const router = useRouter();
  const { login, register, verifyDeviceOtp } = useAuth();
  const { showToast } = useToast();

  const countries = getData();

  const [flow, setFlow] = useState<FlowState>({ step: "loading" });
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [generatedUsername, setGeneratedUsername] = useState("");
  const [showEmailForm, setShowEmailForm] = useState(true);
  const [showLoginEmailForm, setShowLoginEmailForm] = useState(true);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  // Email verification temporarily disabled
  // const [emailVerified, setEmailVerified] = useState(false);
  // const [showOtpInput, setShowOtpInput] = useState(false);
  // const [otp, setOtp] = useState("");
  // const [otpError, setOtpError] = useState("");
  // const [resendCooldown, setResendCooldown] = useState(0);
  // const [sendingOtp, setSendingOtp] = useState(false);
  // const [displayedOtp, setDisplayedOtp] = useState("");

  // Register form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mpin, setMpin] = useState("");
  const [confirmMpin, setConfirmMpin] = useState("");

  // Login form
  const [loginEmail, setLoginEmail] = useState("");
  const [loginMpin, setLoginMpin] = useState("");

  // Field validation states
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [countryError, setCountryError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [loginEmailError, setLoginEmailError] = useState("");
  const [loginMpinError, setLoginMpinError] = useState("");

  // Forgot-PIN modal: same flow as before, but the email is locked to the
  // bag's owner so a stranger tapping the chip can't start a reset on the
  // owner's account from a different identifier.
  const [forgotPinOpen, setForgotPinOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<"otp" | "reset" | "done">("otp");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotResetToken, setForgotResetToken] = useState("");
  const [forgotNewMpin, setForgotNewMpin] = useState("");
  const [forgotConfirmMpin, setForgotConfirmMpin] = useState("");
  const [displayedForgotOtp, setDisplayedForgotOtp] = useState("");

  const [countrySearch, setCountrySearch] = useState("");
  const [countryOpen, setCountryOpen] = useState(false);
  const countryRef = useState<HTMLDivElement | null>(null);
  const filteredCountries = countries.filter(c =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase())
  );

  // Keep bag data when returning from submitting state
  const [savedBag, setSavedBag] = useState<BagInfo | null>(null);

  useEffect(() => {
    if (!iykRef) {
      setFlow({ step: "error", message: "Invalid NFC tap. Missing parameters." });
      return;
    }

    let cancelled = false;

    async function checkBag() {
      try {
        const res = await api.bag.check(iykRef!);
        if (cancelled) return;

        if (!res.success) {
          setFlow({ step: "error", message: res.message || "NFC validation failed." });
          return;
        }

        const data = res.data!;
        const bag = data.bag as BagInfo;
        setSavedBag(bag);

        if (data.status === "new_user") {
          setFlow({ step: "register", bag });
        } else if (data.status === "existing_user") {
          // Persist the NFC token + display info to sessionStorage so a
          // page refresh during PIN entry doesn't drop the user back to
          // the "tap your bag" page.
          if (data.nfcToken) {
            const payload = {
              nfcToken: data.nfcToken,
              maskedEmail: data.maskedEmail || "",
              username: data.username ?? null,
              expiresAt: data.nfcTokenExpiresAt,
              bag,
            };
            try { sessionStorage.setItem("ps_nfc_login", JSON.stringify(payload)); } catch {}
          }
          setLoginEmail(data.maskedEmail || "");
          setFlow({
            step: "login",
            bag,
            auth: {
              nfcToken: data.nfcToken || "",
              maskedEmail: data.maskedEmail || "",
              username: data.username ?? null,
            },
          });
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
  }, [iykRef]);

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
    if (value.length < 5) return "At least 5 characters required";
    // Strong password validation (commented out - not required)
    // if (value.length < 8) return "Password must be at least 8 characters";
    // if (!/[A-Z]/.test(value)) return "Must contain at least 1 uppercase letter";
    // if (!/[a-z]/.test(value)) return "Must contain at least 1 lowercase letter";
    // if (!/[0-9]/.test(value)) return "Must contain at least 1 number";
    // if (!/[!@#$%^&*(),.?":{}|<>]/.test(value)) return "Must contain at least 1 special character";
    return "";
  };

  const calculatePasswordStrength = (value: string) => {
    // Simplified strength calculation
    let score = 0;
    if (value.length >= 5) score++;
    if (value.length >= 8) score++;
    if (value.length >= 12) score++;
    if (/[A-Z]/.test(value)) score++;
    if (/[a-z]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;

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

  // Email verification temporarily disabled
  // const sanitizeOtp = (value: string) => {
  //   return value.replace(/[^0-9]/g, '').slice(0, 6);
  // };

  // const handleSendOtp = async () => {
  //   const emailErr = validateEmail(email);
  //   setEmailError(emailErr);
  //   if (emailErr) return;

  //   setFormError("");
  //   setOtpError("");
  //   setEmailError("");
  //   setSendingOtp(true);
  //   
  //   try {
  //     const res = await api.auth.sendVerificationOtp(email);
  //     if (res.success) {
  //       setShowOtpInput(true);
  //       setResendCooldown(60);
  //       if (res.data?.otp) {
  //         setDisplayedOtp(res.data.otp);
  //         showToast(`Code: ${res.data.otp}`, "success");
  //       } else {
  //         showToast("Verification code sent", "success");
  //       }
  //     } else {
  //       setEmailError(res.message || "Failed to send verification code");
  //     }
  //   } catch {
  //     setEmailError("Unable to connect to server. Please try again.");
  //   } finally {
  //     setSendingOtp(false);
  //   }
  // };

  // const handleVerifyOtp = async () => {
  //   if (otp.length !== 6) {
  //     setOtpError("Please enter a 6-digit code");
  //     return;
  //   }

  //   setOtpError("");
  //   const res = await api.auth.verifyEmailOtp(email, otp);
  //   if (res.success) {
  //     setEmailVerified(true);
  //     setShowOtpInput(false);
  //     showToast("Email verified successfully", "success");
  //   } else {
  //     setOtpError(res.message || "Invalid verification code");
  //   }
  // };

  // const handleResendOtp = async () => {
  //   if (resendCooldown > 0) return;
  //   setDisplayedOtp("");
  //   await handleSendOtp();
  // };

  // // Resend cooldown timer
  // useEffect(() => {
  //   if (resendCooldown > 0) {
  //     const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
  //     return () => clearTimeout(timer);
  //   }
  // }, [resendCooldown]);

  const googleBtnRef = (el: HTMLDivElement | null) => {
    if (!el || !googleReady || typeof window === 'undefined' || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      callback: handleGoogleResponse,
    });
    window.google.accounts.id.renderButton(el, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: el.offsetWidth || 220,
    });
  };

  const googleLoginBtnRef = (el: HTMLDivElement | null) => {
    if (!el || !googleReady || typeof window === 'undefined' || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      callback: handleGoogleResponse,
    });
    window.google.accounts.id.renderButton(el, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: el.offsetWidth || 220,
    });
  };

  const handleGoogleResponse = async (response: { credential: string }) => {
    if (flow.step !== 'register' && flow.step !== 'login') return;
    const bagUid = flow.bag.uid;
    // Existing-user Google login also requires the NFC token (matches the
    // PIN-based login gate); for register the token is unused server-side.
    const nfcToken = flow.step === 'login' ? flow.auth.nfcToken : undefined;
    const { getDeviceFingerprint } = await import("@/app/utils/deviceFingerprint");
    const deviceFingerprint = await getDeviceFingerprint();

    setGoogleLoading(true);
    setFormError("");

    try {
      const res = await api.auth.googleAuth({ credential: response.credential, bagUid, nfcToken, deviceFingerprint });

      if (!res.success) {
        setFormError(res.message || "Google sign-in failed.");
        return;
      }

      const data = res.data as any;
      // Device-OTP path also possible for Google login on unknown devices.
      if (data?.requiresDeviceOtp && data.challengeId && data.email) {
        try { sessionStorage.removeItem("ps_nfc_login"); } catch {}
        setFlow({
          step: "device-otp",
          bag: flow.bag,
          challengeId: data.challengeId,
          email: data.email,
          deviceLabel: data.deviceLabel,
          otp: data.otp,
        });
        if (data.otp) showToast(`Verification code: ${data.otp}`, "success");
        return;
      }

      if (data?.token) localStorage.setItem('ps_token', data.token);
      showToast("Successfully signed in with Google!", "success");
      try { sessionStorage.removeItem("ps_nfc_login"); } catch {}
      router.push(flow.step === 'register' ? "/profile" : "/");
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Google sign-in failed. Please try again.";
      setFormError(msg);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRegister = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError("");

    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const countryErr = !country ? "Country is required" : "";
    const passwordErr = mpin.length !== 4 ? "PIN must be exactly 4 digits" : "";
    const confirmErr = mpin !== confirmMpin ? "PINs do not match" : "";

    setNameError(nameErr);
    setEmailError(emailErr);
    setCountryError(countryErr);
    setPasswordError(passwordErr);
    setConfirmPasswordError(confirmErr);

    if (nameErr || emailErr || countryErr || passwordErr || confirmErr) return;
    if (flow.step !== "register") return;

    const bagUid = flow.bag.uid;
    setFlow({ step: "submitting" });

    const res = await register({ name, email, mpin, bagUid, country });

    if (res.success) {
      if ((res as any).data?.user?.username) {
        setGeneratedUsername((res as any).data.user.username);
      }
      router.push("/profile");
    } else {
      setFormError(res.message || "Registration failed.");
      if (savedBag) setFlow({ step: "register", bag: savedBag });
    }
  };

  const handleLogin = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError("");

    const mpinErr = loginMpin.length !== 4 ? "PIN must be 4 digits" : "";
    setLoginMpinError(mpinErr);

    if (mpinErr) return;
    if (flow.step !== "login") return;

    const { auth, bag } = flow;
    setFlow({ step: "submitting" });

    // Backend resolves the identifier from the NFC token, so we send the
    // masked email purely as a label. The actual auth is { nfcToken, mpin }.
    const res = await login(auth.maskedEmail || "nfc-user", loginMpin, auth.nfcToken);

    if (!res.success) {
      setFormError(res.message || "Invalid email or PIN.");
      setFlow({ step: "login", bag, auth });
      return;
    }

    // Device-verification gate — backend issued an OTP instead of a JWT.
    if (res.requiresDeviceOtp && res.challengeId && res.email) {
      // NFC token is now spent; clear it from sessionStorage so a refresh
      // after the OTP step doesn't try to re-use it.
      try { sessionStorage.removeItem("ps_nfc_login"); } catch {}
      setFlow({
        step: "device-otp",
        bag,
        challengeId: res.challengeId,
        email: res.email,
        deviceLabel: res.deviceLabel,
        otp: res.otp, // dev fallback — surfaced on screen until SMTP is ready
      });
      if (res.otp) showToast(`Verification code: ${res.otp}`, "success");
      return;
    }

    // Normal login — JWT issued, we're in.
    try { sessionStorage.removeItem("ps_nfc_login"); } catch {}
    router.push("/");
  };

  const [deviceOtp, setDeviceOtp] = useState("");
  const [deviceOtpError, setDeviceOtpError] = useState("");

  const handleDeviceOtpSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setDeviceOtpError("");
    if (deviceOtp.length !== 6) {
      setDeviceOtpError("Code must be 6 digits");
      return;
    }
    if (flow.step !== "device-otp") return;
    const res = await verifyDeviceOtp(flow.challengeId, deviceOtp);
    if (res.success) {
      router.push("/");
    } else {
      setDeviceOtpError(res.message || "Invalid code.");
    }
  };

  // Forgot-PIN flow inside the /n page. The email isn't editable — the
  // backend uses the same NFC token to scope the reset to the bag's owner.
  const openForgotPin = async () => {
    if (flow.step !== "login") return;
    setForgotError("");
    setForgotOtp("");
    setForgotResetToken("");
    setForgotNewMpin("");
    setForgotConfirmMpin("");
    setForgotStep("otp");
    setForgotPinOpen(true);
    setDisplayedForgotOtp("");
    setForgotLoading(true);
    try {
      // Hit forgot-password immediately so the OTP is on its way (and shown
      // on screen in dev). The masked-email display means the user doesn't
      // need to type their email — the NFC token resolves the owner.
      const res = await api.auth.forgotPassword(flow.auth.maskedEmail, flow.auth.nfcToken);
      if (res.success) {
        const otp = (res.data as any)?.otp;
        if (otp) setDisplayedForgotOtp(otp);
        showToast("Verification code sent.", "success");
      } else {
        setForgotError(res.message || "Unable to send verification code.");
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const handleVerifyForgotOtp = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (flow.step !== "login") return;
    if (forgotOtp.length !== 6) { setForgotError("Code must be 6 digits."); return; }
    setForgotError("");
    setForgotLoading(true);
    try {
      const res = await api.auth.verifyOtp(flow.auth.maskedEmail, forgotOtp);
      if (res.success && res.data?.resetToken) {
        setForgotResetToken(res.data.resetToken);
        setForgotStep("reset");
      } else {
        setForgotError(res.message || "Invalid code.");
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetMpinNfc = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (forgotNewMpin.length !== 4) { setForgotError("PIN must be 4 digits."); return; }
    if (forgotNewMpin !== forgotConfirmMpin) { setForgotError("PINs do not match."); return; }
    setForgotError("");
    setForgotLoading(true);
    try {
      const res = await api.auth.resetPassword(forgotResetToken, forgotNewMpin);
      if (res.success) {
        setForgotStep("done");
        showToast("PIN reset. You can sign in now.", "success");
      } else {
        setForgotError(res.message || "Unable to reset PIN.");
      }
    } finally {
      setForgotLoading(false);
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
    <div className="flex items-center gap-3 rounded-lg" style={{ backgroundColor: "rgba(232, 201, 106, 0.05)", border: "1px solid rgba(232, 201, 106, 0.15)", padding: "12px", marginBottom: "16px" }}>
      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg" style={{ border: "1px solid rgba(232, 201, 106, 0.2)", backgroundColor: "#0b1326" }}>
        {bag.imageUrl ? (
          <img src={bag.imageUrl} alt={bag.name} className="h-full w-full object-cover" crossOrigin="anonymous" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-white/40">No img</div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-[#E8C96A]" style={{ fontSize: "clamp(14px, 1.6vw, 16px)", fontFamily: "var(--font-poppins), sans-serif", marginBottom: "2px" }}>{bag.name}</div>
        {bag.collection && (
          <div className="truncate text-white/60" style={{ fontSize: "clamp(11px, 1.2vw, 13px)", fontFamily: "var(--font-poppins), sans-serif", marginBottom: "4px" }}>{bag.collection}</div>
        )}
        <div className="flex flex-col" style={{ marginTop: "2px", gap: "2px" }}>
          {bag.tokenId && (
            <div className="truncate font-mono text-white/60" style={{ fontSize: "11px" }}>Serial: #{bag.tokenId}</div>
          )}
          <div className="truncate font-mono text-white/50" style={{ fontSize: "11px" }}>NFC: {bag.uid}</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Google Sign-In Script */}
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGoogleReady(true)}
      />
      
      <div
        className="flex min-h-screen flex-col"
        style={{
          backgroundColor: "#060D1F",
          padding: "0",
        }}
      >
      {/* ── Header Section with Logo ── */}
      <div style={{ 
        backgroundColor: "#060D1F",
        padding: "20px 16px 16px 16px"
      }}>
        <div style={{ maxWidth: "500px", margin: "0 auto", textAlign: "center" }}>
          <div className="mb-3 flex justify-center">
            <Image 
              src="/data/LOGO-PHOTO.png" 
              alt="Pacific Sunday" 
              width={160} 
              height={50} 
              priority 
              className="nfc-logo"
              style={{ borderRadius: "6px", boxShadow: "0 2px 8px rgba(0,0,0,0.3)" }}
            />
          </div>
          <h1 style={{ 
            color: "#E8C96A", 
            fontSize: "clamp(16px, 2.5vw, 20px)", 
            fontFamily: "var(--font-poppins), sans-serif", 
            fontWeight: 600,
            marginBottom: "6px",
            letterSpacing: "0.3px"
          }}>
            NFC Authentication
          </h1>
          <p style={{ 
            color: "#94A3B8", 
            fontSize: "clamp(12px, 1.3vw, 14px)", 
            fontFamily: "var(--font-poppins), sans-serif",
            margin: 0
          }}>
            Secure your golf bag with digital ownership
          </p>
        </div>
      </div>

      {/* ── Container ── */}
      <div className="nfc-container w-full" style={{ padding: "0 16px 16px" }}>

        {/* ── Loading State ── */}
        {flow.step === "loading" && (
          <div style={{ minHeight: "calc(100vh - 200px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div className="nfc-card rounded-lg" style={{ backgroundColor: "#13192A", padding: "50px 30px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "rgba(232, 201, 106, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
                <div className="animate-spin" style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2px solid rgba(232, 201, 106, 0.2)", borderTopColor: "#E8C96A" }} />
              </div>
              <h2 style={{ fontSize: "clamp(16px, 2vw, 20px)", fontFamily: "var(--font-poppins), sans-serif", fontWeight: 600, color: "#FFFFFF", marginBottom: "12px" }}>Verifying NFC Tap</h2>
              <p style={{ fontSize: "clamp(13px, 1.5vw, 15px)", fontFamily: "var(--font-poppins), sans-serif", color: "#94A3B8" }}>Authenticating your bag with the server...</p>
            </div>
          </div>
        )}

        {/* ── Submitting State ── */}
        {flow.step === "submitting" && (
          <div style={{ minHeight: "calc(100vh - 200px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div className="nfc-card rounded-lg" style={{ backgroundColor: "#13192A", padding: "50px 30px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "rgba(232, 201, 106, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "24px" }}>
                <div className="animate-spin" style={{ width: "32px", height: "32px", borderRadius: "50%", border: "2px solid rgba(232, 201, 106, 0.2)", borderTopColor: "#E8C96A" }} />
              </div>
              <h2 style={{ fontSize: "clamp(16px, 2vw, 20px)", fontFamily: "var(--font-poppins), sans-serif", fontWeight: 600, color: "#FFFFFF", marginBottom: "12px" }}>Processing</h2>
              <p style={{ fontSize: "clamp(13px, 1.5vw, 15px)", fontFamily: "var(--font-poppins), sans-serif", color: "#94A3B8" }}>Setting up your account...</p>
            </div>
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
            <div style={{ padding: "24px 24px 16px 24px", textAlign: "center" }}>
              <div style={{ marginBottom: "12px" }}>
                <h2 className="font-semibold text-white" style={{ fontSize: "clamp(18px, 2.2vw, 22px)", fontFamily: "var(--font-poppins), sans-serif", marginBottom: "6px" }}>Create Your Account</h2>
                <p className="text-[#94A3B8]" style={{ fontSize: "clamp(12px, 1.3vw, 14px)", fontFamily: "var(--font-poppins), sans-serif", margin: 0 }}>
                  Register to link your NFC-enabled bag
                </p>
              </div>
            </div>

            <form onSubmit={handleRegister} style={{ padding: "0 24px 24px 24px" }}>
              {/* Bag details card */}
              <BagCard bag={flow.bag} />

              {/* Social sign-up hidden - show email form directly */}
              {!showEmailForm ? (
                <div style={{ marginBottom: "20px" }}>
                  {/* Google & Apple buttons temporarily hidden
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ marginBottom: "16px" }}>
                    <div ref={googleBtnRef} className="w-full" style={{ minHeight: "44px" }} />
                    <button
                      type="button"
                      onClick={() => showToast("Apple sign-up coming soon", "info")}
                      className="flex items-center justify-center gap-2 rounded-md transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{ backgroundColor: "#000000", color: "#FFFFFF", height: "44px", fontFamily: "var(--font-poppins), sans-serif", fontSize: "14px", fontWeight: 500, border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.38c-1.09-.5-2.08-.48-3.24 0c-1.44.62-2.2.44-3.06-.37C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8c1.18-.24 2.31-.93 3.57-.84c1.51.12 2.65.72 3.4 1.8c-3.12 1.87-2.38 5.98.48 7.13c-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25c.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      Continue with Apple
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowEmailForm(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-md transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ backgroundColor: "#E8C96A", color: "#060D1F", height: "44px", fontFamily: "var(--font-poppins), sans-serif", fontSize: "14px", fontWeight: 500 }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    Continue with Email
                  </button>
                  */}
                  {/* Register with Email button hidden - form shown directly */}
                  {/* <button type="button" onClick={() => setShowEmailForm(true)} ...>Register with Email</button> */}
                </div>
              ) : (
                <div style={{ marginBottom: "4px" }}>
                  {/* Back to options hidden - form shown directly */}
                </div>
              )}

              {showEmailForm && formError && (
                <div className="flex items-start gap-2 rounded-md bg-red-500/10" style={{ padding: "12px", marginBottom: "20px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0">
                    <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                  </svg>
                  <p className="text-xs text-red-400" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>{formError}</p>
                </div>
              )}

              {showEmailForm && (
                <>
              {/* Name + Country */}
              <div className="nfc-form-row">
                <div>
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
                    placeholder="Full Name"
                    className={`${inputClass} nfc-input ${nameError ? 'border-red-500/50' : ''}`}
                  />
                  {nameError && <p className="text-xs text-red-400 mt-1" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>{nameError}</p>}
                </div>
                <div>
                  <label className="block text-[#94A3B8]" style={{ fontSize: "clamp(12px, 1.3vw, 14px)", fontFamily: "var(--font-poppins), sans-serif", fontWeight: 400, marginBottom: "8px" }}>Country <span style={{ color: "#EF4444" }}>*</span></label>
                  <div style={{ position: "relative" }} ref={(el) => { (countryRef as any)[0] = el; }}>
                    <input
                      type="text"
                      value={countryOpen ? countrySearch : country}
                      onFocus={() => { setCountryOpen(true); setCountrySearch(""); }}
                      onBlur={() => setTimeout(() => setCountryOpen(false), 150)}
                      onChange={(e) => { setCountrySearch(e.target.value); setCountry(""); setCountryError("Country is required"); }}
                      placeholder="Search country..."
                      autoComplete="off"
                      className={`${inputClass} nfc-input ${countryError ? 'border-red-500/50' : ''}`}
                      style={{ paddingRight: "32px" }}
                    />
                    <svg style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
                    {countryOpen && filteredCountries.length > 0 && (
                      <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100, backgroundColor: "#13192A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", maxHeight: "200px", overflowY: "auto", boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                        {filteredCountries.map((c) => (
                          <div
                            key={c.code}
                            onMouseDown={() => {
                              setCountry(c.name);
                              setCountrySearch(c.name);
                              setCountryError("");
                              setCountryOpen(false);
                            }}
                            style={{ padding: "10px 14px", cursor: "pointer", fontSize: "14px", color: c.name === country ? "#E8C96A" : "#FFFFFF", backgroundColor: c.name === country ? "rgba(232,201,106,0.1)" : "transparent", fontFamily: "var(--font-poppins), sans-serif" }}
                            onMouseEnter={(e) => { if (c.name !== country) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; }}
                            onMouseLeave={(e) => { if (c.name !== country) e.currentTarget.style.backgroundColor = "transparent"; }}
                          >
                            {c.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {countryError && <p className="text-xs text-red-400 mt-1" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>{countryError}</p>}
                </div>
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
                  placeholder="Email Address"
                  className={`${inputClass} nfc-input ${emailError ? 'border-red-500/50' : ''}`}
                />
                {emailError && (
                  <p className="text-xs text-red-400 mt-1" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>{emailError}</p>
                )}
              </div>

              {/* Password + Confirm Password */}
              <div className="nfc-form-row">
                <div>
                  <label className="block text-[#94A3B8]" style={{ fontSize: "clamp(12px, 1.3vw, 14px)", fontFamily: "var(--font-poppins), sans-serif", fontWeight: 400, marginBottom: "8px" }}>PIN <span style={{ color: "#EF4444" }}>*</span> <span style={{ fontSize: "11px", color: "#64748B" }}>(4 digits)</span></label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    required
                    autoComplete="off"
                    value={mpin}
                    onChange={(ev) => {
                      const val = ev.target.value.replace(/\D/g, "").slice(0, 4);
                      setMpin(val);
                      setPasswordError(val.length !== 4 ? "PIN must be exactly 4 digits" : "");
                      if (confirmMpin) setConfirmPasswordError(val !== confirmMpin ? "PINs do not match" : "");
                    }}
                    placeholder="••••"
                    style={{ width: "100%", backgroundColor: "#13192A", border: `1px solid ${passwordError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: "6px", color: "#fff", fontSize: "14px", padding: "10px 12px", outline: "none", letterSpacing: "8px", textAlign: "center", fontFamily: "inherit", WebkitTextSecurity: "disc" } as React.CSSProperties}
                  />
                  {passwordError && <p className="text-xs text-red-400 mt-1" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>{passwordError}</p>}
                </div>
                <div>
                  <label className="block text-[#94A3B8]" style={{ fontSize: "clamp(12px, 1.3vw, 14px)", fontFamily: "var(--font-poppins), sans-serif", fontWeight: 400, marginBottom: "8px" }}>Confirm PIN <span style={{ color: "#EF4444" }}>*</span></label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    required
                    autoComplete="off"
                    value={confirmMpin}
                    onChange={(ev) => {
                      const val = ev.target.value.replace(/\D/g, "").slice(0, 4);
                      setConfirmMpin(val);
                      setConfirmPasswordError(mpin !== val ? "PINs do not match" : "");
                    }}
                    placeholder="••••"
                    style={{ width: "100%", backgroundColor: "#13192A", border: `1px solid ${confirmPasswordError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: "6px", color: "#fff", fontSize: "14px", padding: "10px 12px", outline: "none", letterSpacing: "8px", textAlign: "center", fontFamily: "inherit", WebkitTextSecurity: "disc" } as React.CSSProperties}
                  />
                  {confirmPasswordError && <p className="text-xs text-red-400 mt-1" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>{confirmPasswordError}</p>}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="nfc-btn w-full rounded-md font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                style={{ backgroundColor: "#E8C96A", color: "#060D1F", fontFamily: "var(--font-poppins), sans-serif", height: "44px" }}
              >
                Create Account & Link Bag
              </button>

              {/* Username info */}
              <div className="rounded-md" style={{ backgroundColor: "rgba(232, 201, 106, 0.05)", padding: "12px", border: "1px solid rgba(232, 201, 106, 0.1)", marginTop: "16px" }}>
                <div className="flex items-start gap-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E8C96A" strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 16v-4M12 8h.01" />
                  </svg>
                  <p className="text-xs" style={{ color: "#94A3B8", fontFamily: "var(--font-poppins), sans-serif", lineHeight: "1.5" }}>
                    A unique username will be generated for you based on your name after registration.
                  </p>
                </div>
              </div>
                </>
              )}
            </form>
          </div>
        )}

        {/* ── Login Form ── */}
        {flow.step === "login" && (
          <div className="nfc-card overflow-hidden rounded-lg" style={{ backgroundColor: "#13192A" }}>
            <div style={{ padding: "24px 24px 16px 24px", textAlign: "center" }}>
              <div style={{ marginBottom: "12px" }}>
                <h2 className="font-semibold text-white" style={{ fontSize: "clamp(18px, 2.2vw, 22px)", fontFamily: "var(--font-poppins), sans-serif", marginBottom: "6px" }}>Sign In to Your Account</h2>
                <p className="text-[#94A3B8]" style={{ fontSize: "clamp(12px, 1.3vw, 14px)", fontFamily: "var(--font-poppins), sans-serif", margin: 0 }}>
                  Enter your credentials to continue
                </p>
              </div>
            </div>

            <div style={{ padding: "0 24px 24px 24px" }}>
              <BagCard bag={flow.bag} />

              {formError && (
                <div className="flex items-start gap-2 rounded-md bg-red-500/10" style={{ padding: "12px", marginBottom: "20px" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#F87171" strokeWidth="2" strokeLinecap="round" className="mt-0.5 shrink-0">
                    <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
                  </svg>
                  <p className="text-xs text-red-400" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>{formError}</p>
                </div>
              )}

              {!showLoginEmailForm ? (
                <div style={{ marginBottom: "20px" }}>
                  {/* Google & Apple buttons temporarily hidden
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" style={{ marginBottom: "16px" }}>
                    <div ref={googleLoginBtnRef} className="w-full" style={{ minHeight: "44px" }} />
                    <button
                      type="button"
                      onClick={() => showToast("Apple sign-in coming soon", "info")}
                      className="flex items-center justify-center gap-2 rounded-md transition-all hover:opacity-90 active:scale-[0.98]"
                      style={{ backgroundColor: "#000000", color: "#FFFFFF", height: "44px", fontFamily: "var(--font-poppins), sans-serif", fontSize: "14px", fontWeight: 500, border: "1px solid rgba(255,255,255,0.1)" }}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="#FFFFFF">
                        <path d="M17.05 20.28c-.98.95-2.05.88-3.08.38c-1.09-.5-2.08-.48-3.24 0c-1.44.62-2.2.44-3.06-.37C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8c1.18-.24 2.31-.93 3.57-.84c1.51.12 2.65.72 3.4 1.8c-3.12 1.87-2.38 5.98.48 7.13c-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25c.29 2.58-2.34 4.5-3.74 4.25z"/>
                      </svg>
                      Continue with Apple
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLoginEmailForm(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-md transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ backgroundColor: "#E8C96A", color: "#060D1F", height: "44px", fontFamily: "var(--font-poppins), sans-serif", fontSize: "14px", fontWeight: 500 }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    Continue with Email
                  </button>
                  */}
                  <button
                    type="button"
                    onClick={() => setShowLoginEmailForm(true)}
                    className="w-full flex items-center justify-center gap-2 rounded-md transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ backgroundColor: "#E8C96A", color: "#060D1F", height: "44px", fontFamily: "var(--font-poppins), sans-serif", fontSize: "14px", fontWeight: 500 }}
                  >
                    Sign In with Email
                  </button>
                </div>
              ) : (
                <form onSubmit={handleLogin}>

                  <div style={{ marginBottom: "20px" }}>
                    <label className="block text-[#94A3B8]" style={{ fontSize: "clamp(12px, 1.3vw, 14px)", fontFamily: "var(--font-poppins), sans-serif", fontWeight: 400, marginBottom: "8px" }}>Email Address</label>
                    <input
                      type="text"
                      value={flow.step === "login" ? flow.auth.maskedEmail : loginEmail}
                      readOnly
                      aria-readonly
                      title="Email is auto-filled from your NFC bag and cannot be edited"
                      className={`${inputClass} nfc-input`}
                      style={{ cursor: "not-allowed", opacity: 0.85 }}
                    />
                    <p className="text-xs" style={{ color: "#64748B", marginTop: "6px", fontFamily: "var(--font-poppins), sans-serif" }}>
                      Locked to the bag you tapped — no one else can sign in here.
                    </p>
                  </div>

                  <div style={{ marginBottom: "24px" }}>
                    <label className="block text-[#94A3B8]" style={{ fontSize: "clamp(12px, 1.3vw, 14px)", fontFamily: "var(--font-poppins), sans-serif", fontWeight: 400, marginBottom: "8px" }}>PIN <span style={{ color: "#EF4444" }}>*</span></label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      required
                      autoComplete="off"
                      value={loginMpin}
                      onChange={(ev) => { const val = ev.target.value.replace(/\D/g, "").slice(0, 4); setLoginMpin(val); setLoginMpinError(val.length !== 4 ? "PIN must be 4 digits" : ""); }}
                      placeholder="••••"
                      style={{ width: "100%", backgroundColor: "#13192A", border: `1px solid ${loginMpinError ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`, borderRadius: "6px", color: "#fff", fontSize: "14px", padding: "10px 12px", outline: "none", letterSpacing: "8px", textAlign: "center", fontFamily: "inherit", WebkitTextSecurity: "disc" } as React.CSSProperties}
                    />
                    {loginMpinError && <p className="text-xs text-red-400 mt-1" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>{loginMpinError}</p>}
                    <div style={{ textAlign: "right", marginTop: "8px" }}>
                      <button type="button" onClick={openForgotPin} style={{ color: "#E8C96A", fontSize: "13px", background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "inherit" }}>
                        Forgot PIN?
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="nfc-btn w-full rounded-md font-semibold text-black transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ backgroundColor: "#E8C96A", fontFamily: "var(--font-poppins), sans-serif", height: "44px" }}
                  >
                    Log In
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ── Device verification OTP ── */}
        {flow.step === "device-otp" && (
          <div className="nfc-card overflow-hidden rounded-lg" style={{ backgroundColor: "#13192A" }}>
            <div style={{ padding: "24px 24px 16px 24px", textAlign: "center" }}>
              <h2 className="font-semibold text-white" style={{ fontSize: "clamp(18px, 2.2vw, 22px)", fontFamily: "var(--font-poppins), sans-serif", marginBottom: "6px" }}>
                Verify this device
              </h2>
              <p className="text-[#94A3B8]" style={{ fontSize: "clamp(12px, 1.3vw, 14px)", fontFamily: "var(--font-poppins), sans-serif", margin: 0 }}>
                {flow.deviceLabel ? `Signing in from ${flow.deviceLabel} for the first time.` : "Signing in from a new device."}
              </p>
            </div>
            <div style={{ padding: "0 24px 24px 24px" }}>
              <BagCard bag={flow.bag} />
              <p className="text-[#94A3B8]" style={{ fontSize: "13px", marginBottom: "16px", fontFamily: "var(--font-poppins), sans-serif" }}>
                We sent a 6-digit code to <span style={{ color: "#fff" }}>{flow.email}</span>. Enter it below to trust this device.
              </p>
              {flow.otp && (
                <div style={{ backgroundColor: "rgba(232, 201, 106, 0.08)", border: "1px solid rgba(232, 201, 106, 0.2)", borderRadius: "6px", padding: "10px 12px", marginBottom: "16px" }}>
                  <p style={{ color: "#E8C96A", fontSize: "12px", margin: 0, fontFamily: "var(--font-poppins), sans-serif" }}>
                    Dev mode — your code is <strong style={{ letterSpacing: "2px" }}>{flow.otp}</strong>
                  </p>
                </div>
              )}
              <form onSubmit={handleDeviceOtpSubmit}>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={deviceOtp}
                  onChange={(e) => setDeviceOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  required
                  autoFocus
                  style={{ width: "100%", backgroundColor: "#13192A", border: `1px solid ${deviceOtpError ? "rgba(239,68,68,0.5)" : "rgba(255,255,255,0.1)"}`, borderRadius: "6px", color: "#fff", fontSize: "20px", padding: "12px", outline: "none", letterSpacing: "8px", textAlign: "center", fontWeight: 600, fontFamily: "inherit", marginBottom: "8px" } as React.CSSProperties}
                />
                {deviceOtpError && <p className="text-xs text-red-400 mt-1" style={{ fontFamily: "var(--font-poppins), sans-serif" }}>{deviceOtpError}</p>}
                <button
                  type="submit"
                  disabled={deviceOtp.length !== 6}
                  className="nfc-btn w-full rounded-md font-semibold transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{ backgroundColor: "#E8C96A", color: "#060D1F", fontFamily: "var(--font-poppins), sans-serif", height: "44px", marginTop: "12px", cursor: deviceOtp.length !== 6 ? "not-allowed" : "pointer", opacity: deviceOtp.length !== 6 ? 0.6 : 1 }}
                >
                  Verify & Sign In
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="mt-5 text-center text-[11px] text-[#3a4560] sm:mt-6">
          Pacific Sunday 2026 &mdash; NFC-Powered Digital Ownership
        </p>
      </div>

      {/* ── Forgot PIN modal — email is locked to the tapped bag's owner ── */}
      {forgotPinOpen && flow.step === "login" && (
        <div onClick={() => setForgotPinOpen(false)} style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", zIndex: 50 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: "440px", backgroundColor: "#13192A", borderRadius: "8px", padding: "28px", fontFamily: "var(--font-poppins), sans-serif", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h2 style={{ color: "#E8C96A", fontSize: "20px", fontWeight: 600, margin: 0 }}>
                {forgotStep === "otp" && "Reset PIN"}
                {forgotStep === "reset" && "New PIN"}
                {forgotStep === "done" && "PIN Updated"}
              </h2>
              <button onClick={() => setForgotPinOpen(false)} style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: "22px", padding: "4px" }} aria-label="Close">×</button>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", display: "block", marginBottom: "6px" }}>Email</label>
              <input type="text" value={flow.auth.maskedEmail} readOnly style={{ width: "100%", backgroundColor: "#0b1326", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "6px", color: "#94A3B8", fontSize: "14px", padding: "10px 12px", outline: "none", cursor: "not-allowed", fontFamily: "inherit" }} />
              <p style={{ color: "#64748B", fontSize: "11px", marginTop: "4px" }}>Locked to the bag you tapped.</p>
            </div>

            {forgotStep === "otp" && (
              <form onSubmit={handleVerifyForgotOtp}>
                <p style={{ color: "#94A3B8", fontSize: "13px", marginBottom: "12px" }}>
                  We sent a 6-digit code. Enter it below.
                </p>
                {displayedForgotOtp && (
                  <div style={{ backgroundColor: "rgba(232, 201, 106, 0.08)", border: "1px solid rgba(232, 201, 106, 0.2)", borderRadius: "6px", padding: "10px 12px", marginBottom: "12px" }}>
                    <p style={{ color: "#E8C96A", fontSize: "12px", margin: 0 }}>Dev mode — your code is <strong style={{ letterSpacing: "2px" }}>{displayedForgotOtp}</strong></p>
                  </div>
                )}
                <input type="text" inputMode="numeric" maxLength={6} value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, "").slice(0, 6))} required autoFocus
                  style={{ width: "100%", backgroundColor: "#13192A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", fontSize: "20px", padding: "10px 12px", outline: "none", letterSpacing: "8px", textAlign: "center", fontWeight: 600, marginBottom: "12px", fontFamily: "inherit" }} />
                {forgotError && <p style={{ color: "#EF4444", fontSize: "13px", marginBottom: "12px" }}>{forgotError}</p>}
                <button type="submit" disabled={forgotLoading || forgotOtp.length !== 6}
                  style={{ width: "100%", backgroundColor: "#E8C96A", color: "#060D1F", border: "none", borderRadius: "6px", padding: "12px", fontSize: "15px", fontWeight: 500, cursor: forgotLoading || forgotOtp.length !== 6 ? "not-allowed" : "pointer", opacity: forgotLoading || forgotOtp.length !== 6 ? 0.6 : 1, fontFamily: "inherit" }}>
                  {forgotLoading ? "Verifying..." : "Verify Code"}
                </button>
              </form>
            )}

            {forgotStep === "reset" && (
              <form onSubmit={handleResetMpinNfc}>
                <p style={{ color: "#94A3B8", fontSize: "13px", marginBottom: "16px" }}>Enter your new 4-digit PIN.</p>
                <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", display: "block", marginBottom: "6px" }}>New PIN</label>
                <input type="text" inputMode="numeric" maxLength={4} value={forgotNewMpin}
                  onChange={(e) => setForgotNewMpin(e.target.value.replace(/\D/g, "").slice(0, 4))} required autoComplete="off" autoFocus
                  style={{ width: "100%", backgroundColor: "#13192A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", fontSize: "14px", padding: "10px 12px", outline: "none", letterSpacing: "8px", textAlign: "center", fontFamily: "inherit", WebkitTextSecurity: "disc", marginBottom: "12px" } as React.CSSProperties} placeholder="••••" />
                <label style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", display: "block", marginBottom: "6px" }}>Confirm PIN</label>
                <input type="text" inputMode="numeric" maxLength={4} value={forgotConfirmMpin}
                  onChange={(e) => setForgotConfirmMpin(e.target.value.replace(/\D/g, "").slice(0, 4))} required autoComplete="off"
                  style={{ width: "100%", backgroundColor: "#13192A", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "6px", color: "#fff", fontSize: "14px", padding: "10px 12px", outline: "none", letterSpacing: "8px", textAlign: "center", fontFamily: "inherit", WebkitTextSecurity: "disc", marginBottom: "12px" } as React.CSSProperties} placeholder="••••" />
                {forgotError && <p style={{ color: "#EF4444", fontSize: "13px", marginBottom: "12px" }}>{forgotError}</p>}
                <button type="submit" disabled={forgotLoading}
                  style={{ width: "100%", backgroundColor: "#E8C96A", color: "#060D1F", border: "none", borderRadius: "6px", padding: "12px", fontSize: "15px", fontWeight: 500, cursor: forgotLoading ? "not-allowed" : "pointer", opacity: forgotLoading ? 0.6 : 1, fontFamily: "inherit" }}>
                  {forgotLoading ? "Updating..." : "Update PIN"}
                </button>
              </form>
            )}

            {forgotStep === "done" && (
              <div>
                <p style={{ color: "#94A3B8", fontSize: "13px", marginBottom: "16px" }}>Your PIN has been updated. Close this and sign in with the new PIN.</p>
                <button type="button" onClick={() => setForgotPinOpen(false)}
                  style={{ width: "100%", backgroundColor: "#E8C96A", color: "#060D1F", border: "none", borderRadius: "6px", padding: "12px", fontSize: "15px", fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                  Back to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </>
  );
}
