import { STATUSES, type ApplicationStats, type ApplicationStatus } from '../api/types'
import { STATUS_META } from '../lib/status'

interface Props {
    stats: ApplicationStats | undefined
    active: ApplicationStatus | null
    onSelect: (status: ApplicationStatus | null) => void
}

export function PipelineBar({ stats, active, onSelect }: Props) {
    const total = stats?.total ?? 0
    const summary = stats
        ? STATUSES.map((s) => `${stats.byStatus[s]} ${STATUS_META[s].label.toLowerCase()}`).join(', ')
        : 'Loading'

    return (
        <section aria-label="Applications by status" className="mt-8 rounded-2xl border border-line bg-surface p-4 sm:p-5">
            <div role="img" aria-label={summary} className="flex h-3 w-full gap-1">
                {stats && total > 0 ? (
                    STATUSES.filter((s) => stats.byStatus[s] > 0).map((s) => (
                        <div
                            key={s}
                            className={`h-full min-w-2 rounded-full ${STATUS_META[s].bar}`}
                            style={{ flex: `${stats.byStatus[s]} 1 0%` }}
                        />
                    ))
                ) : (
                    <div className="h-full w-full rounded-full bg-line" />
                )}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                <FilterButton label="All" count={total} active={active === null} onClick={() => onSelect(null)} />
                {STATUSES.map((s) => (
                    <FilterButton
                        key={s}
                        label={STATUS_META[s].label}
                        dot={STATUS_META[s].dot}
                        count={stats?.byStatus[s] ?? 0}
                        active={active === s}
                        onClick={() => onSelect(s)}
                    />
                ))}
            </div>
        </section>
    )
}

function FilterButton(props: { label: string; count: number; active: boolean; dot?: string; onClick: () => void }) {
    return (
        <button
            type="button"
            aria-pressed={props.active}
            onClick={props.onClick}
            className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                props.active ? 'border-pine-600 bg-pine-50' : 'border-transparent hover:bg-paper'
            }`}
        >
      <span className="flex items-center gap-2 font-medium">
        {props.dot && <span className={`size-2.5 rounded-full ${props.dot}`} />}
          {props.label}
      </span>
            <span className="font-display text-lg font-semibold tabular-nums">{props.count}</span>
        </button>
    )
}