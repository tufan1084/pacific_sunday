"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import ConfirmDialog from "@/app/components/ui/ConfirmDialog";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  /**
   * Tint for the confirm button. Defaults to the app gold (#E8C96A). Pass a
   * destructive red like "#EF4444" for irreversible actions ("Delete forever",
   * "Remove follower") so the user reads the weight before clicking.
   */
  confirmColor?: string;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

interface State {
  open: boolean;
  options: ConfirmOptions;
}

const DEFAULT_OPTIONS: ConfirmOptions = { title: "", message: "" };

/**
 * Provides a promise-based confirm() replacement for the whole app. Use it
 * via useConfirm() to keep the call site ergonomically identical to the old
 * window.confirm() while rendering a styled ConfirmDialog instead of a native
 * browser dialog. The native dialogs were rejected because they're styled by
 * the OS (jarring against the dark theme), blocking on the main thread, and
 * dismissed by Safari on PWA standalone in ways the user can't predict.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ open: false, options: DEFAULT_OPTIONS });
  // The pending Promise's resolver. Held in a ref so onConfirm/onClose can
  // signal the original caller without re-rendering on every dialog change.
  const resolverRef = useRef<((result: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
      setState({ open: true, options });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    resolverRef.current?.(true);
    resolverRef.current = null;
  }, []);

  const handleClose = useCallback(() => {
    // ConfirmDialog calls onClose for both the cancel button AND after a
    // successful confirm. Resolving with false here is only correct when the
    // promise hasn't already been settled — handleConfirm nulls the ref so
    // the late onClose becomes a no-op.
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
    setState((prev) => ({ ...prev, open: false }));
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        isOpen={state.open}
        onClose={handleClose}
        title={state.options.title}
        message={state.options.message}
        confirmText={state.options.confirmText}
        cancelText={state.options.cancelText}
        confirmColor={state.options.confirmColor}
        onConfirm={handleConfirm}
      />
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");
  return ctx;
}
