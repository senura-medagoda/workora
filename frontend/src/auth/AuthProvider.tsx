import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiFetch, refreshSession, setAccessToken, setAuthFailureHandler } from '../api/client'
import type { AuthResponse, User } from '../api/types'
import { AuthContext, type AuthContextValue, type Credentials, type RegisterData } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const queryClient = useQueryClient() // the missing line: gives us access to the data cache

    // On app start: try to restore the session from the refresh cookie.
    useEffect(() => {
        setAuthFailureHandler(() => {
            setAccessToken(null)
            queryClient.clear() // forget the previous user's cached data
            setUser(null)
        })

        let cancelled = false
        refreshSession()
            .then((result) => {
                if (!cancelled) setUser(result?.user ?? null)
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })

        return () => {
            cancelled = true // StrictMode runs this cleanup, then the effect again; both share ONE refresh promise
            setAuthFailureHandler(null)
        }
    }, [queryClient])

    const login = useCallback(async (credentials: Credentials) => {
        const data = await apiFetch<AuthResponse>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
        })
        setAccessToken(data.accessToken)
        setUser(data.user)
    }, [])

    const register = useCallback(
        async ({ fullName, email, password }: RegisterData) => {
            await apiFetch('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ fullName, email, password }),
            })
            await login({ email, password }) // registration doesn't log you in by itself, so we do it
        },
        [login],
    )

    const logout = useCallback(async () => {
        try {
            await apiFetch<void>('/auth/logout', { method: 'POST' })
        } finally {
            setAccessToken(null)
            queryClient.clear()
            setUser(null)
        }
    }, [queryClient])

    const value = useMemo<AuthContextValue>(
        () => ({ user, loading, login, register, logout }),
        [user, loading, login, register, logout],
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}