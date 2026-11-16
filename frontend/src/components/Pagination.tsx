import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
    page: number
    size: number
    totalPages: number
    totalElements: number
    onChange: (page: number) => void
}

export function Pagination({ page, size, totalPages, totalElements, onChange }: Props) {
    const from = page * size + 1
    const to = Math.min((page + 1) * size, totalElements)
    return (
        <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm text-muted sm:px-5">
            <p>
                Showing {from} to {to} of {totalElements}
            </p>
            {totalPages > 1 && (
                <div className="flex items-center gap-1">
                    <button type="button" className="btn-icon" disabled={page === 0} onClick={() => onChange(page - 1)} aria-label="Previous page">
                        <ChevronLeft className="size-5" />
                    </button>
                    <span className="px-2 tabular-nums">
            {page + 1} / {totalPages}
          </span>
                    <button type="button" className="btn-icon" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)} aria-label="Next page">
                        <ChevronRight className="size-5" />
                    </button>
                </div>
            )}
        </div>
    )
}