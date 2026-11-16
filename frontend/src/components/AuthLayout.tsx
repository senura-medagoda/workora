import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Logo } from './Logo'

interface Props {
    title: string
    subtitle: string
    footer: ReactNode
    children: ReactNode
}

export function AuthLayout({ title, subtitle, footer, children }: Props) {
    return (
        <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
            <aside className="hidden flex-col justify-between bg-pine-900 p-10 text-white lg:flex">
                <Link to="/" className="flex items-center gap-2.5" aria-label="Workora home">
                    <Logo />
                    <span className="font-display text-xl font-semibold">Workora</span>
                </Link>
                <div>
                    <p className="max-w-sm font-display text-4xl font-semibold leading-tight">Every application in one clear pipeline.</p>
                    <p className="mt-4 max-w-sm text-white/70">Log a role in seconds, move it through the stages, and see your whole search at a glance.</p>
                </div>
                <p className="max-w-sm text-sm text-white/60">Your applications are private. Every request is authenticated and scoped to your account.</p>
            </aside>

            <main className="flex items-center justify-center px-4 py-12 sm:px-8">
                <div className="w-full max-w-md">
                    <Link to="/" className="mb-10 flex items-center gap-2.5 lg:hidden" aria-label="Workora home">
                        <Logo />
                        <span className="font-display text-xl font-semibold">Workora</span>
                    </Link>
                    <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
                    <p className="mt-2 text-muted">{subtitle}</p>
                    <div className="mt-8">{children}</div>
                    <p className="mt-6 text-sm text-muted">{footer}</p>
                </div>
            </main>
        </div>
    )
}