import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { Check, CircleAlert } from 'lucide-react'
import { ToastContext, type ToastApi } from './toastContext'

interface Toast {
    id: number
    message: string
    tone: 'success' | 'error'
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([])
    const nextId = useRef(0)

    const push = useCallback((message: string, tone: Toast['tone']) => {
        const id = nextId.current++
        setToasts((current) => [...current, { id, message, tone }])
        window.setTimeout(() => setToasts((current) => current.filter((t) => t.id !== id)), 4000)
    }, [])

    const api = useMemo<ToastApi>(
        () => ({ success: (m) => push(m, 'success'), error: (m) => push(m, 'error') }),
        [push],
    )

    return (
        <ToastContext.Provider value={api}>
            {children}
            <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        role="status"
                        className={`pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg ${
                            t.tone === 'success' ? 'bg-pine-900' : 'bg-st-rejected'
                        }`}
                    >
                        {t.tone === 'success' ? <Check className="size-4 text-marigold" /> : <CircleAlert className="size-4" />}
                        {t.message}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    )
}