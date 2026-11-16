import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

type Variant = 'sheet' | 'modal' | 'modal-wide'

interface Props {
    open: boolean
    onClose: () => void
    title: string
    variant?: Variant
    children: ReactNode
}

// The inner wrapper decides how the content is laid out inside the <dialog>.
// For modal-wide, the max height keeps the dialog inside the screen, and the body below scrolls.
const containerClass: Record<Variant, string> = {
    sheet: 'flex h-full flex-col',
    modal: 'flex flex-col',
    'modal-wide': 'flex max-h-[calc(100dvh-2rem)] flex-col',
}

export function Dialog({ open, onClose, title, variant = 'sheet', children }: Props) {
    const ref = useRef<HTMLDialogElement>(null)
    const titleId = useId()

    useEffect(() => {
        const el = ref.current
        if (!el) return
        if (open && !el.open) el.showModal()
        else if (!open && el.open) el.close()
    }, [open])

    return (
        <dialog
            ref={ref}
            className={variant}
            aria-labelledby={titleId}
            onClose={onClose} // fires for Esc too
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose() // a click on the dimmed backdrop
            }}
        >
            {open && (
                <div className={containerClass[variant]}>
                    <div className="flex items-center justify-between border-b border-line px-6 py-4">
                        <h2 id={titleId} className="text-xl font-semibold">
                            {title}
                        </h2>
                        <button type="button" className="btn-icon" onClick={onClose} aria-label="Close">
                            <X className="size-5" />
                        </button>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
                </div>
            )}
        </dialog>
    )
}