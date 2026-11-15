import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

export default function ProtectedRoute() {
    const { user, loading } = useAuth()
    const location = useLocation()

    if (loading) {
        return <div className="flex min-h-screen items-center justify-center text-slate-500">Loading…</div>
    }
    if (!user) {
        // remember where the user wanted to go, so we can send them back after login
        return <Navigate to="/login" replace state={{ from: location }} />
    }
    return <Outlet />
}