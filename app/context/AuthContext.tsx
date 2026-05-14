"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { User } from "@/app/types";
import { api, type LoginResponse } from "@/app/services/api";
import { initializeSocket, disconnectSocket } from "@/app/services/socket";
import { getDeviceFingerprint } from "@/app/utils/deviceFingerprint";
import { setRememberedLogin, clearRememberedLogin } from "@/app/utils/rememberedLogin";

// Mask "john.doe@example.com" → "j***@example.com". Mirrors the backend
// util in src/utils/maskEmail.js so the remembered-login blob shows the
// same masked form as the NFC tap landing.
function maskEmailClient(email?: string | null) {
  if (!email) return "***";
  const at = email.indexOf("@");
  if (at < 1) return "***";
  return `${email[0]}***@${email.slice(at + 1)}`;
}

// Shape that comes back from login(): either fully authenticated, or holding a
// device-OTP challenge that the caller needs to satisfy via verifyDeviceOtp().
export interface LoginResult {
  success: boolean;
  message: string;
  requiresDeviceOtp?: boolean;
  challengeId?: number;
  email?: string;
  otp?: string; // dev fallback when SMTP isn't wired up
  deviceLabel?: string;
}

export interface QuickLoginResult {
  success: boolean;
  message: string;
  requiresNfcTap?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, mpin: string, nfcToken?: string) => Promise<LoginResult>;
  verifyDeviceOtp: (challengeId: number, otp: string) => Promise<{ success: boolean; message: string }>;
  quickLogin: (userId: number, mpin: string) => Promise<QuickLoginResult>;
  register: (body: { name: string; email: string; mpin: string; bagUid: string; country?: string }) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

function persistSession(token: string, user: User) {
  localStorage.setItem("ps_token", token);
  localStorage.setItem("ps_user_id", user.id.toString());
  localStorage.setItem("ps_username", user.name || user.username || "");
  // Stamp a "you've signed in here before" blob so /login can offer
  // PIN-only re-login next time without an NFC tap.
  setRememberedLogin({
    userId: user.id,
    maskedEmail: maskEmailClient(user.email),
    username: user.username ?? null,
  });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    const token = localStorage.getItem("ps_token");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await api.auth.me();
      if (res.success && res.data) {
        setUser(res.data.user);
        localStorage.setItem("ps_username", res.data.user.name || res.data.user.username || "");
        initializeSocket(res.data.user.id);
      } else {
        localStorage.removeItem("ps_token");
      }
    } catch {
      localStorage.removeItem("ps_token");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = async (email: string, mpin: string, nfcToken?: string): Promise<LoginResult> => {
    const deviceFingerprint = await getDeviceFingerprint();
    const res = await api.auth.login({ email, mpin, nfcToken, deviceFingerprint });

    if (!res.success) {
      return { success: false, message: res.message };
    }

    const data = (res.data || {}) as LoginResponse;

    // Backend returned an OTP challenge instead of a JWT — surface that to
    // the caller so the /n page can render the device-verification step.
    if (data.requiresDeviceOtp) {
      return {
        success: true,
        message: res.message,
        requiresDeviceOtp: true,
        challengeId: data.challengeId,
        email: data.email,
        otp: data.otp,
        deviceLabel: data.deviceLabel,
      };
    }

    if (data.token && data.user) {
      persistSession(data.token, data.user);
      setUser(data.user);
      initializeSocket(data.user.id);
    }
    return { success: true, message: res.message };
  };

  const verifyDeviceOtp = async (challengeId: number, otp: string) => {
    const res = await api.auth.verifyDeviceOtp(challengeId, otp);
    if (res.success && res.data) {
      const data = res.data as { token: string; user: User };
      persistSession(data.token, data.user);
      setUser(data.user);
      initializeSocket(data.user.id);
    }
    return { success: res.success, message: res.message };
  };

  const quickLogin = async (userId: number, mpin: string): Promise<QuickLoginResult> => {
    const deviceFingerprint = await getDeviceFingerprint();
    if (!deviceFingerprint) {
      // Can't run the trusted-device gate without a fingerprint — bounce
      // the user back to the NFC tap flow.
      return { success: false, message: "Browser blocked the security check. Please tap your bag.", requiresNfcTap: true };
    }
    const res = await api.auth.quickLogin({ userId, mpin, deviceFingerprint });
    if (!res.success) {
      const data = res.data as { requiresNfcTap?: boolean } | null;
      return { success: false, message: res.message, requiresNfcTap: data?.requiresNfcTap };
    }
    const data = res.data as { token: string; user: User };
    persistSession(data.token, data.user);
    setUser(data.user);
    initializeSocket(data.user.id);
    return { success: true, message: res.message };
  };

  const register = async (body: { name: string; email: string; mpin: string; bagUid: string; country?: string }) => {
    const deviceFingerprint = await getDeviceFingerprint();
    const res = await api.auth.register({ ...body, deviceFingerprint });
    if (res.success && res.data) {
      const data = res.data as { token: string; user: User };
      persistSession(data.token, data.user);
      setUser(data.user);
    }
    return { success: res.success, message: res.message };
  };

  // Logout drops the JWT but keeps `ps_remembered_login` so the next visit
  // to /login can offer PIN-only re-entry. Use clearRememberedLogin() from
  // the "sign in as a different user" link to fully forget the device.
  const logout = () => {
    if (user) {
      disconnectSocket(user.id);
    }
    localStorage.removeItem("ps_token");
    localStorage.removeItem("ps_user_id");
    localStorage.removeItem("ps_username");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, verifyDeviceOtp, quickLogin, register, logout, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
