import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { FormField } from '../components/FormField'

const schema = z.object({
    email: z.email('Enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
})
type FormValues = z.infer<typeof schema>

export default function LoginPage() {
    const { user, login } = useAuth()
    const location = useLocation()
    const [serverError, setServerError] = useState<string | null>(null)
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>({ resolver: zodResolver(schema) })

    const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/dashboard'

    // already logged in (or just logged in): go to the dashboard
    if (user) return <Navigate to={from} replace />

    const onSubmit = async (values: FormValues) => {
        setServerError(null)
        try {
            await login(values)
        } catch (e) {
            setServerError(
                e instanceof ApiError && e.status === 401
                    ? 'Invalid email or password'
                    : 'Something went wrong. Please try again.',
            )
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow">
                <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
                <p className="mt-1 text-sm text-slate-500">Log in to your Workora account</p>

                <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
                    <FormField label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register('email')} />
                    <FormField
                        label="Password"
                        type="password"
                        autoComplete="current-password"
                        error={errors.password?.message}
                        {...register('password')}
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
                        {isSubmitting ? 'Logging in…' : 'Log in'}
                    </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-500">
                    New here?{' '}
                    <Link to="/register" className="font-medium text-indigo-600 hover:underline">
                        Create an account
                    </Link>
                </p>
            </div>
        </main>
    )
}