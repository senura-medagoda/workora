import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { LayoutDashboard, ListChecks, Plus, ShieldCheck } from 'lucide-react'
import { useAuth } from '../auth/useAuth'
import { Logo } from '../components/Logo'
import { STATUS_META } from '../lib/status'
import type { ApplicationStatus } from '../api/types'

const sample: { company: string; role: string; date: string; status: ApplicationStatus }[] = [
    { company: 'Northwind Labs', role: 'Frontend Engineer', date: '12 Nov', status: 'INTERVIEWING' },
    { company: 'Harbor & Co', role: 'Java Developer', date: '10 Nov', status: 'APPLIED' },
    { company: 'Lumen Health', role: 'Backend Engineer', date: '4 Nov', status: 'OFFER' },
    { company: 'Brightpath', role: 'Platform Engineer', date: '29 Oct', status: 'REJECTED' },
]
const sampleBar: [ApplicationStatus, number][] = [['APPLIED', 5], ['INTERVIEWING', 3], ['OFFER', 1], ['REJECTED', 2]]

const features = [
    { icon: Plus, title: 'Log an application in seconds', text: 'Company, role, date, link and notes in one short form. No spreadsheets to maintain.' },
    { icon: ListChecks, title: 'Move it through the stages', text: 'Change an application from Applied to Interviewing, Offer, Rejected or Withdrawn straight from the list.' },
    { icon: LayoutDashboard, title: 'See your whole search at once', text: 'The pipeline bar shows where everything stands. Select a stage to filter the list.' },
]

const privacy = [
    'Your applications are visible only to you.',
    'Sessions use short-lived tokens that refresh quietly in the background.',
    'Passwords are hashed and never stored in readable form.',
]

export default function LandingPage() {
    const { user } = useAuth()
    const primaryTo = user ? '/dashboard' : '/register'

    return (
        <div className="min-h-screen">
            <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur">
                <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6" aria-label="Main">
                    <a href="#home" className="flex items-center gap-2.5" aria-label="Workora home">
                        <Logo />
                        <span className="font-display text-xl font-semibold">Workora</span>
                    </a>
                    <div className="flex items-center gap-4 text-sm font-medium sm:gap-6">
                        <a href="#home" className="hidden hover:text-pine-600 sm:inline">Home</a>
                        <a href="#about" className="hover:text-pine-600">About</a>
                        {user ? (
                            <Link to="/dashboard" className="btn btn-primary">Dashboard</Link>
                        ) : (
                            <>
                                <Link to="/login" className="hover:text-pine-600">Log in</Link>
                                <Link to="/register" className="btn btn-primary">Register</Link>
                            </>
                        )}
                    </div>
                </nav>
            </header>

            <main>
                <section id="home" className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                    <div>
                        <h1 className="text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
                            Know where every application stands.
                        </h1>
                        <p className="mt-6 max-w-md text-lg text-muted">
                            Workora keeps each role you apply for in one pipeline, from the first submission to the final answer.
                        </p>
                        <div className="mt-9 flex flex-wrap gap-3">
                            <Link to={primaryTo} className="btn btn-primary px-6 py-3 text-base">
                                {user ? 'Open your dashboard' : 'Create free account'}
                            </Link>
                            {!user && (
                                <Link to="/login" className="btn btn-secondary px-6 py-3 text-base">
                                    Log in
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* decorative product preview, hidden from screen readers */}
                    <div aria-hidden="true" className="rounded-2xl border border-line bg-surface p-4 shadow-[0_28px_60px_-32px_rgba(10,47,38,0.4)] sm:p-5">
                        <div className="flex h-2.5 gap-1">
                            {sampleBar.map(([s, n]) => (
                                <div key={s} className={`h-full rounded-full ${STATUS_META[s].bar}`} style={{ flex: `${n} 1 0%` }} />
                            ))}
                        </div>
                        <ul className="mt-4 divide-y divide-line">
                            {sample.map((row, i) => (
                                <li key={row.company} className="reveal flex items-center justify-between gap-3 py-3.5" style={{ '--i': i + 1 } as CSSProperties}>
                                    <div className="min-w-0">
                                        <p className="truncate font-display font-semibold">{row.company}</p>
                                        <p className="truncate text-sm text-muted">{row.role} · {row.date}</p>
                                    </div>
                                    <span className={`shrink-0 rounded-full px-3 py-1 text-sm font-semibold ${STATUS_META[row.status].badge}`}>
                    {STATUS_META[row.status].label}
                  </span>
                                </li>
                            ))}
                        </ul>
                        <p className="pt-2 text-right text-xs text-muted">Sample data</p>
                    </div>
                </section>

                <section className="border-y border-line bg-surface">
                    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-3">
                        {features.map(({ icon: Icon, title, text }) => (
                            <div key={title} className="border-t-2 border-pine-600 pt-5">
                                <Icon className="size-6 text-pine-600" aria-hidden="true" />
                                <h2 className="mt-4 text-xl font-semibold">{title}</h2>
                                <p className="mt-2 max-w-sm text-muted">{text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="about" className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1fr_1.2fr]">
                    <div>
                        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">Built to keep your search private</h2>
                        <p className="mt-4 max-w-md text-muted">
                            Workora is a full-stack project built with Spring Boot, PostgreSQL and React. Security was a starting point, not an afterthought.
                        </p>
                    </div>
                    <ul className="space-y-4">
                        {privacy.map((line) => (
                            <li key={line} className="flex gap-3">
                                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-pine-600" aria-hidden="true" />
                                <span>{line}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                {!user && (
                    <section className="bg-pine-900 text-white">
                        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-4 py-14 sm:px-6 md:flex-row md:items-center">
                            <h2 className="max-w-md text-3xl font-semibold tracking-tight">Start your pipeline today.</h2>
                            <Link to="/register" className="btn bg-marigold px-6 py-3 text-base text-pine-900 hover:bg-marigold/90">
                                Create free account
                            </Link>
                        </div>
                    </section>
                )}
            </main>

            <footer className="px-4 py-8 text-center text-sm text-muted">© {new Date().getFullYear()} Workora</footer>
        </div>
    )
}