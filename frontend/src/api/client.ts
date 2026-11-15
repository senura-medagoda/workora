import type { AuthResponse, ProblemDetail } from './types'

const API_BASE = '/api/v1'

export class ApiError extends Error {
    status: number
    fieldErrors: Record<string, string>

    constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
        super(message)
        this.name = 'ApiError'
        this.status = status
        this.fieldErrors = fieldErrors
    }
}

// ---- module-level state: lives in memory only, never in localStorage ----
let accessToken: string | null = null
let refreshPromise: Promise<AuthResponse | null> | null = null
let authFailureHandler: (() => void) | null = null

export function setAccessToken(token: string | null): void {
    accessToken = token
}

/** AuthProvider registers a callback here so the client can tell the UI "you were logged out". */
export function setAuthFailureHandler(handler: (() => void) | null): void {
    authFailureHandler = handler
}

async function toApiError(res: Response): Promise<ApiError> {
    let problem: Partial<ProblemDetail> = {}
    try {
        problem = await res.json()
    } catch {
        // empty or non-JSON body: fall through to defaults
    }
    return new ApiError(res.status, problem.detail ?? 'Request failed', problem.errors ?? {})
}

async function doRefresh(): Promise<AuthResponse | null> {
    try {
        // the browser attaches the HttpOnly refresh cookie by itself
        const res = await fetch(`${API_BASE}/auth/refresh`, { method: 'POST', credentials: 'include' })
        if (!res.ok) {
            accessToken = null
            return null
        }
        const data = (await res.json()) as AuthResponse
        accessToken = data.accessToken
        return data
    } catch {
        accessToken = null // network error: treat as logged out
        return null
    }
}

/**
 * Refreshes the session. If a refresh is already running, everyone shares that SAME promise,
 * so the single-use refresh token is never sent twice.
 */
export function refreshSession(): Promise<AuthResponse | null> {
    if (!refreshPromise) {
        refreshPromise = doRefresh().finally(() => {
            refreshPromise = null
        })
    }
    return refreshPromise
}

/**
 * Every API call goes through here. It adds the Bearer token, and if the server says 401
 * (token expired) it refreshes once and retries the original request once.
 */
export async function apiFetch<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
    const headers = new Headers(init.headers)
    if (init.body) headers.set('Content-Type', 'application/json')
    if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`)

    const res = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: 'include' })

    // auth endpoints answer 401 for "wrong password" etc.: never try to refresh for those
    if (res.status === 401 && retry && !path.startsWith('/auth/')) {
        const refreshed = await refreshSession()
        if (refreshed) return apiFetch<T>(path, init, false)
        authFailureHandler?.()
    }

    if (!res.ok) throw await toApiError(res)
    if (res.status === 204) return undefined as T
    return (await res.json()) as T
}