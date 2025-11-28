"use client"

import * as React from "react"
import { X } from "lucide-react"

interface Toast {
    id: string
    title?: string
    description?: string
    variant?: "default" | "destructive"
}

interface ToastContextType {
    toast: (props: Omit<Toast, "id">) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<Toast[]>([])

    const toast = React.useCallback(({ title, description, variant = "default" }: Omit<Toast, "id">) => {
        const id = Math.random().toString(36).substring(2, 9)
        setToasts((prev) => [...prev, { id, title, description, variant }])
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 5000)
    }, [])

    const removeToast = React.useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    return (
        <ToastContext.Provider value={{ toast }}>
            {children}
            <div className="fixed bottom-0 right-0 z-50 p-4 space-y-4 max-w-md w-full pointer-events-none">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`pointer-events-auto flex items-start justify-between p-4 rounded-md shadow-lg border ${t.variant === "destructive" ? "bg-red-600 text-white border-red-700" : "bg-white text-gray-900 border-gray-200"
                            }`}
                    >
                        <div className="flex-1">
                            {t.title && <h3 className="font-semibold text-sm">{t.title}</h3>}
                            {t.description && <p className="text-sm opacity-90">{t.description}</p>}
                        </div>
                        <button
                            onClick={() => removeToast(t.id)}
                            className="ml-4 text-current opacity-70 hover:opacity-100"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}

export function useToast() {
    const context = React.useContext(ToastContext)
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider")
    }
    return context
}
