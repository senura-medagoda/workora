import type { ReactNode } from 'react'

interface Props {
    label: string
    htmlFor: string
    error?: string
    hint?: string
    children: ReactNode
}

export function FormField({ label, htmlFor, error, hint, children }: Props) {
    return (
        <div>
            <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium">
                {label}
            </label>
            {children}
            {hint && !error && <p className="mt-1.5 text-sm text-muted">{hint}</p>}
            {error && (
                <p role="alert" className="mt-1.5 text-sm text-st-rejected">
                    {error}
                </p>
            )}
        </div>
    )
}