"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

type Handler = () => void | Promise<void>;

interface RefreshContextValue {
  register: (h: Handler | null) => void;
  trigger: () => Promise<void>;
}

const RefreshContext = createContext<RefreshContextValue | null>(null);

/**
 * Provides a single pull-to-refresh hook for the whole app. The currently
 * mounted page (if any) registers its own refresh function via
 * useRegisterRefresh. When the user pulls in the app shell, AppShell calls
 * trigger() which delegates to that registered handler — or falls back to a
 * full page reload if the page didn't register anything.
 */
export function RefreshProvider({ children }: { children: ReactNode }) {
  const handlerRef = useRef<Handler | null>(null);

  const register = useCallback((h: Handler | null) => {
    handlerRef.current = h;
  }, []);

  const trigger = useCallback(async () => {
    if (handlerRef.current) {
      await handlerRef.current();
      return;
    }
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  }, []);

  return (
    <RefreshContext.Provider value={{ register, trigger }}>{children}</RefreshContext.Provider>
  );
}

/**
 * Pages call this with their refresh function (typically `refresh` from
 * usePageData). The registration is ref-based so the page may pass an
 * unstable function identity without thrashing the registration.
 */
export function useRegisterRefresh(handler: Handler) {
  const ctx = useContext(RefreshContext);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!ctx) return;
    const wrapper: Handler = () => handlerRef.current();
    ctx.register(wrapper);
    return () => ctx.register(null);
  }, [ctx]);
}

export function useGlobalRefresh(): Handler {
  const ctx = useContext(RefreshContext);
  return (
    ctx?.trigger ??
    (async () => {
      if (typeof window !== "undefined") window.location.reload();
    })
  );
}
