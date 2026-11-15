export interface User {
    id: string
    email: string
    fullName: string
}

export interface AuthResponse {
    accessToken: string
    tokenType: string
    expiresIn: number
    user: User
}

/** Shape of our backend's error responses (RFC 9457 "problem details") */
export interface ProblemDetail {
    status: number
    detail?: string
    errors?: Record<string, string>
}