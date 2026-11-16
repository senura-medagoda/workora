import { ExternalLink, Pencil, Trash2 } from 'lucide-react'
import type { JobApplication } from '../api/types'
import { formatDate } from '../lib/format'
import { StatusSelect } from './StatusSelect'

const GRID = 'md:grid-cols-[minmax(0,2.2fr)_minmax(0,1.2fr)_7.5rem_10rem_5.5rem]'

interface Props {
    items: JobApplication[]
    onEdit: (app: JobApplication) => void
    onDelete: (app: JobApplication) => void
}

export function ApplicationList({ items, onEdit, onDelete }: Props) {
    return (
        <div>
            <div className={`hidden gap-4 border-b border-line px-5 py-3 text-sm font-medium text-muted md:grid ${GRID}`}>
                <span>Role</span>
                <span>Location</span>
                <span>Applied</span>
                <span>Status</span>
                <span className="sr-only">Actions</span>
            </div>

            <ul className="divide-y divide-line">
                {items.map((app) => (
                    <li
                        key={app.id}
                        className={`grid grid-cols-2 items-center gap-x-3 gap-y-3 px-4 py-4 sm:px-5 md:gap-4 ${GRID}`}
                    >
                        <div className="col-span-2 min-w-0 md:col-span-1">
                            <p className="truncate font-display text-lg font-semibold leading-tight">{app.companyName}</p>
                            <p className="mt-0.5 flex items-center gap-2 text-sm text-muted">
                                <span className="truncate">{app.jobTitle}</span>
                                {app.jobUrl && (
                                    <a
                                        href={app.jobUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label={`Open the job posting for ${app.companyName}`}
                                        className="shrink-0 text-pine-600 hover:text-pine-700"
                                    >
                                        <ExternalLink className="size-4" />
                                    </a>
                                )}
                            </p>
                        </div>

                        <p className="truncate text-sm text-muted">{app.location ?? '—'}</p>
                        <p className="text-right text-sm tabular-nums text-muted md:text-left">
                            <span className="md:hidden">Applied </span>
                            {formatDate(app.appliedDate)}
                        </p>

                        <StatusSelect app={app} />

                        <div className="flex justify-end gap-1">
                            <button type="button" className="btn-icon" onClick={() => onEdit(app)} aria-label={`Edit ${app.companyName}`}>
                                <Pencil className="size-4" />
                            </button>
                            <button type="button" className="btn-icon hover:text-st-rejected" onClick={() => onDelete(app)} aria-label={`Delete ${app.companyName}`}>
                                <Trash2 className="size-4" />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}