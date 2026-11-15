import type { ComponentProps } from 'react'

type Props = ComponentProps<'input'> & { label: string; error?: string }

export function FormField({ label, error, id, ...inputProps }: Props) {
    const inputId = id ?? inputProps.name
    return (
        <div>
            <label htmlFor={inputId} className="mb-1 block text-sm font-medium text-slate-700">
                {label}
            </label>
            <input
                id={inputId}
                aria-invalid={!!error}
                className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500 ${
                    error ? 'border-red-500' : 'border-slate-300'
                }`}
                {...inputProps}
            />
            {error && (
                <p role="alert" className="mt-1 text-sm text-red-600">
                    {error}
                </p>
            )}
        </div>
    )
}