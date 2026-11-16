import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, Navigate } from 'react-router-dom'
import { ApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { AuthLayout } from '../components/AuthLayout'
import { FormField } from '../components/FormField'

const schema = z
    .object({
        fullName: z.string().trim().min(1, 'Enter your full name').max(100, 'Keep it under 100 characters'),
        email: z.email('Enter a valid email address'),
        password: z.string().min(12, 'Use at least 12 characters').max(72, 'Use at most 72 characters'),
        confirmPassword: z.string(),
    })
    .refine((d) => d.password === d.confirmPassword, { message: 'The passwords do not match', path: ['confirmPassword'] })
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
                setError('email', { message: 'An account with this email already exists. Try logging in instead.' })
            } else if (e instanceof ApiError && e.status === 400) {
                setServerError(Object.values(e.fieldErrors)[0] ?? 'Check your details and try again.')
            } else {
                setServerError('Something went wrong on our side. Try again in a moment.')
            }
        }
    }

    return (
        <AuthLayout
            title="Create your account"
            subtitle="It takes a minute. Then add your first application."
            footer={
                <>
                    Already have an account?{' '}
                    <Link to="/login" className="font-semibold text-pine-600 hover:underline">
                        Log in
                    </Link>
                </>
            }
        >
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
                <FormField label="Full name" htmlFor="fullName" error={errors.fullName?.message}>
                    <input id="fullName" autoComplete="name" className="field" aria-invalid={!!errors.fullName} {...register('fullName')} />
                </FormField>
                <FormField label="Email" htmlFor="email" error={errors.email?.message}>
                    <input id="email" type="email" autoComplete="email" className="field" aria-invalid={!!errors.email} {...register('email')} />
                </FormField>
                <FormField label="Password" htmlFor="password" error={errors.password?.message} hint="At least 12 characters. A short phrase works well.">
                    <input id="password" type="password" autoComplete="new-password" className="field" aria-invalid={!!errors.password} {...register('password')} />
                </FormField>
                <FormField label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
                    <input id="confirmPassword" type="password" autoComplete="new-password" className="field" aria-invalid={!!errors.confirmPassword} {...register('confirmPassword')} />
                </FormField>
                {serverError && (
                    <p role="alert" className="rounded-lg bg-st-rejected/10 px-3 py-2 text-sm text-st-rejected">
                        {serverError}
                    </p>
                )}
                <button type="submit" disabled={isSubmitting} className="btn btn-primary w-full">
                    {isSubmitting ? 'Creating account…' : 'Create account'}
                </button>
            </form>
        </AuthLayout>
    )
}