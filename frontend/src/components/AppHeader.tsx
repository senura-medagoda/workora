import { LogOut } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { Logo } from './Logo'

export function AppHeader() {
    const { user, logout } = useAuth()
    return (
        <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
                <Link to="/" className="flex items-center gap-2.5" aria-label="Workora home">
                    <Logo />
                    <span className="font-display text-xl font-semibold">Workora</span>
                </Link>
                <div className="flex items-center gap-3">
                    <span className="hidden text-sm text-muted sm:inline">{user?.fullName}</span>
                    <button type="button" className="btn btn-secondary" onClick={logout}>
                        <LogOut className="size-4" />
                        Log out
                    </button>
                </div>
            </div>
        </header>
    )
}