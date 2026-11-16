export function Logo({ className = 'size-8' }: { className?: string }) {
    return (
        <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
            <rect width="32" height="32" rx="8" fill="#0e5a47" />
            <rect x="7" y="9" width="18" height="3.5" rx="1.75" fill="#fff" />
            <rect x="7" y="14.25" width="12" height="3.5" rx="1.75" fill="#fff" opacity=".75" />
            <rect x="7" y="19.5" width="7" height="3.5" rx="1.75" fill="#f5b83d" />
        </svg>
    )
}