"use client"

import { createContext, useCallback, useContext, useState } from "react"

interface ToastItem {
  id: number
  message: string
  tone: "default" | "success" | "error"
  leaving?: boolean
}

interface ToastContextValue {
  showToast: (message: string, tone?: ToastItem["tone"]) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const LIFE_MS = 3500 // also drives the timer hairline (--toast-life)
const EXIT_MS = 180 // matches toast-out in globals.css

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: number) => {
    // Play the exit, then remove.
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, leaving: true } : t)))
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), EXIT_MS)
  }, [])

  const showToast = useCallback(
    (message: string, tone: ToastItem["tone"] = "default") => {
      const id = Date.now() + Math.random()
      setToasts((prev) => [...prev, { id, message, tone }])
      setTimeout(() => dismiss(id), LIFE_MS)
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="toast-item"
            data-tone={t.tone}
            data-leaving={t.leaving ? "true" : undefined}
            role={t.tone === "error" ? "alert" : "status"}
            style={{ "--toast-life": `${LIFE_MS}ms` } as React.CSSProperties}
            onClick={() => dismiss(t.id)}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within ToastProvider")
  return ctx
}
