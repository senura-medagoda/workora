import { createContext } from 'react'
import type { User } from '../api/types'

export interface Credentials {
    email: string
    password: string
}

export interface RegisterData extends Credentials {
    fullName: string
}

export interface AuthContextValue {
    user: User | null
    loading: boolean // true until the first silent refresh finishes
    login: (credentials: Credentials) => Promise<void>
    register: (data: RegisterData) => Promise<void>
    logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)