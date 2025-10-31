import React, { createContext, useContext, useMemo, useState } from "react";

export type Toast = {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  duration?: number; // ms
};

type ToastContextValue = {
  toasts: Toast[];
  show: (t: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const api = useMemo<ToastContextValue>(() => ({
    toasts,
    show: ({ type, message, duration = 3000 }) => {
      const id = Math.random().toString(36).slice(2);
      const toast: Toast = { id, type, message, duration };
      setToasts(prev => [...prev, toast]);
      if (duration > 0) {
        setTimeout(() => {
          setToasts(prev => prev.filter(t => t.id !== id));
        }, duration);
      }
    },
    dismiss: (id: string) => setToasts(prev => prev.filter(t => t.id !== id)),
  }), [toasts]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Container */}
      <div className="pointer-events-none fixed inset-x-0 top-3 z-[100] flex flex-col items-center gap-2 px-3">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 rounded-xl px-4 py-2 text-sm shadow-lg ${
              t.type === 'success' ? 'bg-green-600 text-white' :
              t.type === 'error' ? 'bg-red-600 text-white' :
              t.type === 'warning' ? 'bg-yellow-500 text-gray-900' : 'bg-gray-800 text-white'
            }`}
            role="status"
          >
            <span>{t.message}</span>
            <button className="rounded p-1/2 hover:opacity-80" onClick={() => api.dismiss(t.id)} aria-label="Close">
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
