import type { ApplicationStatus } from '../api/types'

// Full class names are written out on purpose: Tailwind finds classes by scanning source text,
// so it can't see classes assembled from string pieces.
export const STATUS_META: Record<ApplicationStatus, { label: string; badge: string; bar: string; dot: string }> = {
    APPLIED: { label: 'Applied', badge: 'bg-st-applied/10 text-st-applied', bar: 'bg-st-applied', dot: 'bg-st-applied' },
    INTERVIEWING: { label: 'Interviewing', badge: 'bg-st-interviewing/10 text-st-interviewing', bar: 'bg-st-interviewing', dot: 'bg-st-interviewing' },
    OFFER: { label: 'Offer', badge: 'bg-st-offer/10 text-st-offer', bar: 'bg-st-offer', dot: 'bg-st-offer' },
    REJECTED: { label: 'Rejected', badge: 'bg-st-rejected/10 text-st-rejected', bar: 'bg-st-rejected', dot: 'bg-st-rejected' },
    WITHDRAWN: { label: 'Withdrawn', badge: 'bg-st-withdrawn/10 text-st-withdrawn', bar: 'bg-st-withdrawn', dot: 'bg-st-withdrawn' },
}