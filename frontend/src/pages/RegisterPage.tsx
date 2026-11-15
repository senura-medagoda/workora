import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { FormField } from '../components/FormField'

// the same rules as the backend (RegisterRequest). The backend still enforces them: this is only for fast feedback.
const schema = z
    .object({
        fullName: z.string().trim().min(1, 'Full name is required').max(100, 'At most 100 characters'),
        email: z.email('Enter a valid email address'),
        password: z.string().min(12, 'Use at least 12 characters').max(72, 'At most 72 characters'),
        confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: 'Passwords do not match',
        path: ['confirmPassword'],
    })
type FormValues = z.infer<typeof schema>

export default function RegisterPage() {
    const { user, register: registerUser } = useAuth()
    const [serverError, setServerError] = useState<string | null>(null)
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({ resolver: zodResolver(schema) })

    if (user) return <Navigate to="/dashboard" replace />

    const onSubmit = async ({ fullName, email, password }: FormValues) => {
        setServerError(null)
        try {
            await registerUser({ fullName, email, password })
        } catch (e) {
            if (e instanceof ApiError && e.status === 409) {
                setError('email', { message: 'An account with this email already exists' })
            } else if (e instanceof ApiError && e.status === 400) {
                setServerError(Object.values(e.fieldErrors)[0] ?? 'Please check your details')
            } else {
                setServerError('Something went wrong. Please try again.')
            }
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
                <h1 className="text-2xl font-bold text-slate-900">Create your account</h1>
                <p className="mt-1 text-sm text-slate-500">Start tracking your job search</p>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
                    <FormField label="Full name" autoComplete="name" error={errors.fullName?.message} {...register('fullName')} />
                    <FormField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
                    <FormField
                        label="Password (12+ characters)"
                        type="password"
                        autoComplete="new-password"
                        error={errors.password?.message}
                        {...register('password')}
                    />
                    <FormField
                        label="Confirm password"
                        type="password"
                        autoComplete="new-password"
                        error={errors.confirmPassword?.message}
                        {...register('confirmPassword')}
                    />
                    {serverError && (
                        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                            {serverError}
                        </p>
                    )}
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
                    >
                        {isSubmitting ? 'Creating account…' : 'Create account'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500">
                    Already have an account?{' '}
                    <Link to="/login" className="font-medium text-indigo-600 hover:underline">
                        Log in
                    </Link>
                </p>
            </div>
        </main>
    )
}