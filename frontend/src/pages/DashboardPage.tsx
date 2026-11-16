import { useState } from 'react'
import { Inbox, Plus } from 'lucide-react'
import { PAGE_SIZE, useApplications, useDeleteApplication, useStats } from '../api/applications'
import type { ApplicationStats, ApplicationStatus, JobApplication } from '../api/types'
import { ApplicationForm } from '../components/ApplicationForm'
import { ApplicationList } from '../components/ApplicationList'
import { AppHeader } from '../components/AppHeader'
import { Dialog } from '../components/Dialog'
import { Pagination } from '../components/Pagination'
import { PipelineBar } from '../components/PipelineBar'
import { STATUS_META } from '../lib/status'
import { useToast } from '../toast/toastContext'

function summarize(stats: ApplicationStats | undefined): string {
    if (!stats) return 'Loading your applications…'
    if (stats.total === 0) return 'Nothing tracked yet. Add the first role you applied for.'
    const { total, byStatus } = stats
    const offers = byStatus.OFFER
    return `${total} ${total === 1 ? 'application' : 'applications'} tracked. ${byStatus.INTERVIEWING} in interviews, ${offers} ${offers === 1 ? 'offer' : 'offers'}.`
}

export default function DashboardPage() {
    const toast = useToast()
    const [status, setStatus] = useState<ApplicationStatus | null>(null)
    const [page, setPage] = useState(0)
    const [formOpen, setFormOpen] = useState(false)
    const [editing, setEditing] = useState<JobApplication | null>(null)
    const [deleting, setDeleting] = useState<JobApplication | null>(null)

    const stats = useStats()
    const list = useApplications(status, page)
    const remove = useDeleteApplication()

    const openCreate = () => {
        setEditing(null)
        setFormOpen(true)
    }
    const openEdit = (app: JobApplication) => {
        setEditing(app)
        setFormOpen(true)
    }
    const selectStatus = (s: ApplicationStatus | null) => {
        setStatus(s)
        setPage(0)
    }

    const confirmDelete = () => {
        if (!deleting) return
        remove.mutate(deleting.id, {
            onSuccess: () => {
                // deleting the only row on the last page would leave an empty page: step back one
                if (list.data?.content.length === 1 && page > 0) setPage(page - 1)
                setDeleting(null)
                toast.success('Application deleted')
            },
            onError: () => {
                setDeleting(null)
                toast.error('Could not delete the application. Try again.')
            },
        })
    }

    const data = list.data

    return (
        <>
            <AppHeader />
            <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Your pipeline</h1>
                        <p className="mt-1.5 text-muted">{summarize(stats.data)}</p>
                    </div>
                    <button type="button" className="btn btn-primary" onClick={openCreate}>
                        <Plus className="size-4" />
                        Add application
                    </button>
                </div>

                <PipelineBar stats={stats.data} active={status} onSelect={selectStatus} />

                <section aria-label="Applications" className="mt-6 overflow-hidden rounded-2xl border border-line bg-surface">
                    {list.isLoading ? (
                        <ListSkeleton />
                    ) : list.isError ? (
                        <div className="px-6 py-14 text-center">
                            <p className="font-medium">We couldn't load your applications.</p>
                            <p className="mt-1 text-sm text-muted">Check your connection, then try again.</p>
                            <button type="button" className="btn btn-secondary mt-5" onClick={() => list.refetch()}>
                                Try again
                            </button>
                        </div>
                    ) : data && data.content.length === 0 ? (
                        <div className="px-6 py-16 text-center">
                            <Inbox className="mx-auto size-10 text-muted" aria-hidden="true" />
                            {status ? (
                                <>
                                    <p className="mt-4 font-display text-xl font-semibold">No applications in {STATUS_META[status].label}</p>
                                    <p className="mt-1 text-sm text-muted">Change an application's status and it will show up here.</p>
                                    <button type="button" className="btn btn-secondary mt-5" onClick={() => selectStatus(null)}>
                                        Show all applications
                                    </button>
                                </>
                            ) : (
                                <>
                                    <p className="mt-4 font-display text-xl font-semibold">Your pipeline is empty</p>
                                    <p className="mt-1 text-sm text-muted">Add the first role you applied for and it will appear here.</p>
                                    <button type="button" className="btn btn-primary mt-5" onClick={openCreate}>
                                        <Plus className="size-4" />
                                        Add application
                                    </button>
                                </>
                            )}
                        </div>
                    ) : (
                        data && (
                            <>
                                <ApplicationList items={data.content} onEdit={openEdit} onDelete={setDeleting} />
                                <Pagination page={page} size={PAGE_SIZE} totalPages={data.totalPages} totalElements={data.totalElements} onChange={setPage} />
                            </>
                        )
                    )}
                </section>
            </main>

            <Dialog open={formOpen} onClose={() => setFormOpen(false)} title={editing ? 'Edit application' : 'Add application'} variant="modal-wide">
                <ApplicationForm key={editing?.id ?? 'new'} initial={editing} onDone={() => setFormOpen(false)} />
            </Dialog>

            <Dialog open={!!deleting} onClose={() => setDeleting(null)} title="Delete this application?" variant="modal">
                {deleting && (
                    <>
                        <p className="text-sm text-muted">
                            Your application for <strong className="text-ink">{deleting.jobTitle}</strong> at{' '}
                            <strong className="text-ink">{deleting.companyName}</strong> will be permanently deleted. This can't be undone.
                        </p>
                        <div className="mt-6 flex justify-end gap-3">
                            <button type="button" className="btn btn-secondary" onClick={() => setDeleting(null)}>
                                Keep it
                            </button>
                            <button type="button" className="btn btn-danger" onClick={confirmDelete} disabled={remove.isPending}>
                                {remove.isPending ? 'Deleting…' : 'Delete application'}
                            </button>
                        </div>
                    </>
                )}
            </Dialog>
        </>
    )
}

function ListSkeleton() {
    return (
        <div aria-busy="true" aria-label="Loading applications" className="divide-y divide-line">
            {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex animate-pulse items-center justify-between gap-6 px-5 py-5">
                    <div className="space-y-2">
                        <div className="h-4 w-40 rounded bg-line" />
                        <div className="h-3 w-28 rounded bg-line" />
                    </div>
                    <div className="h-7 w-28 rounded-full bg-line" />
                </div>
            ))}
        </div>
    )
}