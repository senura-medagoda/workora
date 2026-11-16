import { useChangeStatus } from '../api/applications'
import { STATUSES, type ApplicationStatus, type JobApplication } from '../api/types'
import { STATUS_META } from '../lib/status'
import { useToast } from '../toast/toastContext'

export function StatusSelect({ app }: { app: JobApplication }) {
    const change = useChangeStatus()
    const toast = useToast()

    const onChange = (status: ApplicationStatus) => {
        change.mutate(
            { id: app.id, status },
            {
                onSuccess: () => toast.success(`Moved to ${STATUS_META[status].label}`),
                onError: () => toast.error('Could not update the status. Try again.'),
            },
        )
    }

    return (
        <select
            aria-label={`Status for ${app.companyName}`}
            value={app.status}
            disabled={change.isPending}
            onChange={(e) => onChange(e.target.value as ApplicationStatus)}
            className={`w-full cursor-pointer rounded-full py-1.5 pl-3 pr-8 text-sm font-semibold disabled:opacity-60 ${STATUS_META[app.status].badge}`}
        >
            {STATUSES.map((s) => (
                <option key={s} value={s}>
                    {STATUS_META[s].label}
                </option>
            ))}
        </select>
    )
}