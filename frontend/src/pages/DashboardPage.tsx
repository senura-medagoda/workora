import { useEffect, useState } from 'react'
import { apiFetch } from '../api/client'
import type { User } from '../api/types'
import { useAuth } from '../auth/useAuth'

export default function DashboardPage() {
    const { user, logout } = useAuth()
    const [profile, setProfile] = useState<User | null>(null)

    useEffect(() => {
        apiFetch<User>('/users/me').then(setProfile).catch(() => setProfile(null))
    }, [])

    return (
        <main className="mx-auto max-w-3xl px-4 py-16">
            <h1 className="text-3xl font-bold text-slate-900">Hello, {user?.fullName} 👋</h1>
            <p className="mt-2 text-slate-600">
                Authenticated call to <code>/users/me</code> returned: {profile ? profile.email : '…'}
            </p>
            <button onClick={logout} className="mt-8 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50">
                Log out
            </button>
        </main>
    )
}