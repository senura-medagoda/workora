/** Today in the USER's time zone as yyyy-mm-dd (toISOString would use UTC and can be off by a day). */
export function todayISO(): string {
    const d = new Date()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${d.getFullYear()}-${month}-${day}`
}

/** "2026-11-10" -> "10 Nov 2026". Parsed by hand so the time zone can't shift the date. */
export function formatDate(iso: string): string {
    const [y, m, d] = iso.split('-').map(Number)
    return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(y, m - 1, d))
}