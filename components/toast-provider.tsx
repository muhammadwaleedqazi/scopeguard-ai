"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ToastTone = "success" | "error" | "info";

interface ToastInput {
  title: string;
  message?: string;
  tone?: ToastTone;
}

interface Toast extends ToastInput {
  id: string;
  tone: ToastTone;
}

interface ToastContextValue {
  addToast: (toast: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((input: ToastInput) => {
    const id = crypto.randomUUID();
    const toast: Toast = {
      ...input,
      id,
      tone: input.tone ?? "info",
    };

    setToasts((current) => [...current, toast].slice(-4));
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4_000);
  }, []);

  const value = useMemo(() => ({ addToast }), [addToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="toast-viewport"
        aria-live="polite"
        aria-relevant="additions removals"
      >
        {toasts.map((toast) => (
          <div
            className={`toast toast-${toast.tone}`}
            key={toast.id}
            role={toast.tone === "error" ? "alert" : "status"}
          >
            <span className="toast-indicator" aria-hidden="true" />
            <div>
              <strong>{toast.title}</strong>
              {toast.message && <p>{toast.message}</p>}
            </div>
            <button
              type="button"
              aria-label={`Dismiss ${toast.title} notification`}
              onClick={() => removeToast(toast.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
