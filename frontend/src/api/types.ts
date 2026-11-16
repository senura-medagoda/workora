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
export const STATUSES = ['APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED', 'WITHDRAWN'] as const
export type ApplicationStatus = (typeof STATUSES)[number]

export interface JobApplication {
    id: string
    companyName: string
    jobTitle: string
    location: string | null
    jobUrl: string | null
    status: ApplicationStatus
    appliedDate: string // "2026-11-10"
    notes: string | null
    createdAt: string
    updatedAt: string
}

/** What the form sends (matches the backend's JobApplicationRequest). */
export interface ApplicationInput {
    companyName: string
    jobTitle: string
    location: string
    jobUrl: string
    status: ApplicationStatus
    appliedDate: string
    notes: string
}

export interface Page<T> {
    content: T[]
    page: number
    size: number
    totalElements: number
    totalPages: number
}

export interface ApplicationStats {
    total: number
    byStatus: Record<ApplicationStatus, number>
}