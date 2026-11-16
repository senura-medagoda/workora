import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { AuthLayout } from '../components/AuthLayout'
import { FormField } from '../components/FormField'

const schema = z.object({
    email: z.email('Enter a valid email address'),
    password: z.string().min(1, 'Enter your password'),
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
    if (user) return <Navigate to={from} replace />

    const onSubmit = async (values: FormValues) => {
        setServerError(null)
        try {
            await login(values)
        } catch (e) {
            setServerError(
                e instanceof ApiError && e.status === 401
                    ? 'The email or password is incorrect. Check both and try again.'
                    : 'Something went wrong on our side. Try again in a moment.',
            )
        }
    }

    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Log in to see your pipeline."
            footer={
                <>
                    New to Workora?{' '}
                    <Link to="/register" className="font-semibold text-pine-600 hover:underline">
                        Create an account
                    </Link>
                </>
            }
        >
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                <FormField label="Email" htmlFor="email" error={errors.email?.message}>
                    <input id="email" type="email" autoComplete="email" className="field" aria-invalid={!!errors.email} {...register('email')} />
                </FormField>
                <FormField label="Password" htmlFor="password" error={errors.password?.message}>
                    <input id="password" type="password" autoComplete="current-password" className="field" aria-invalid={!!errors.password} {...register('password')} />
                </FormField>
                {serverError && (
                    <p role="alert" className="rounded-lg bg-st-rejected/10 px-3 py-2 text-sm text-st-rejected">
                        {serverError}
                    </p>
                )}
                <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
                    {isSubmitting ? 'Logging in…' : 'Log in'}
                </button>
            </form>
        </AuthLayout>
    )
}