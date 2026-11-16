import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCreateApplication, useUpdateApplication } from '../api/applications'
import { ApiError } from '../api/client'
import { STATUSES, type JobApplication } from '../api/types'
import { todayISO } from '../lib/format'
import { STATUS_META } from '../lib/status'
import { useToast } from '../toast/toastContext'
import { FormField } from './FormField'

// Mirrors the backend rules for fast feedback. The backend still validates everything.
const schema = z.object({
    companyName: z.string().trim().min(1, 'Enter the company name').max(150, 'Keep it under 150 characters'),
    jobTitle: z.string().trim().min(1, 'Enter the job title').max(150, 'Keep it under 150 characters'),
    location: z.string().trim().max(150, 'Keep it under 150 characters'),
    jobUrl: z
        .string()
        .trim()
        .max(500, 'Keep the link under 500 characters')
        .refine((v) => v === '' || /^https?:\/\/\S+$/i.test(v), 'The link must start with http:// or https://'),
    status: z.enum(STATUSES),
    appliedDate: z.string().min(1, 'Pick the date you applied'),
    notes: z.string().max(5000, 'Keep notes under 5,000 characters'),
})
type FormValues = z.infer<typeof schema>

interface Props {
    initial: JobApplication | null
    onDone: () => void
}

export function ApplicationForm({ initial, onDone }: Props) {
    const toast = useToast()
    const create = useCreateApplication()
    const update = useUpdateApplication()
    const [serverError, setServerError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            companyName: initial?.companyName ?? '',
            jobTitle: initial?.jobTitle ?? '',
            location: initial?.location ?? '',
            jobUrl: initial?.jobUrl ?? '',
            status: initial?.status ?? 'APPLIED',
            appliedDate: initial?.appliedDate ?? todayISO(),
            notes: initial?.notes ?? '',
        },
    })

    const pending = create.isPending || update.isPending

    const onSubmit = async (values: FormValues) => {
        setServerError(null)
        try {
            if (initial) {
                await update.mutateAsync({ id: initial.id, data: values })
                toast.success('Changes saved')
            } else {
                await create.mutateAsync(values)
                toast.success('Application added')
            }
            onDone()
        } catch (e) {
            if (e instanceof ApiError && e.status === 400 && Object.keys(e.fieldErrors).length > 0) {
                Object.entries(e.fieldErrors).forEach(([field, message]) => {
                    if (field in schema.shape) setError(field as keyof FormValues, { message })
                })
            } else {
                setServerError('Could not save the application. Check your connection and try again.')
            }
        }
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Company" htmlFor="companyName" error={errors.companyName?.message}>
                    <input id="companyName" className="field" aria-invalid={!!errors.companyName} autoFocus {...register('companyName')} />
                </FormField>
                <FormField label="Job title" htmlFor="jobTitle" error={errors.jobTitle?.message}>
                    <input id="jobTitle" className="field" aria-invalid={!!errors.jobTitle} {...register('jobTitle')} />
                </FormField>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Status" htmlFor="status" error={errors.status?.message}>
                    <select id="status" className="field" {...register('status')}>
                        {STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {STATUS_META[s].label}
                            </option>
                        ))}
                    </select>
                </FormField>
                <FormField label="Date applied" htmlFor="appliedDate" error={errors.appliedDate?.message}>
                    <input id="appliedDate" type="date" className="field" aria-invalid={!!errors.appliedDate} {...register('appliedDate')} />
                </FormField>
            </div>

            <FormField label="Location (optional)" htmlFor="location" error={errors.location?.message}>
                <input id="location" className="field" placeholder="Colombo, or Remote" aria-invalid={!!errors.location} {...register('location')} />
            </FormField>

            <FormField label="Job posting link (optional)" htmlFor="jobUrl" error={errors.jobUrl?.message}>
                <input id="jobUrl" type="url" className="field" placeholder="https://" aria-invalid={!!errors.jobUrl} {...register('jobUrl')} />
            </FormField>

            <FormField label="Notes (optional)" htmlFor="notes" error={errors.notes?.message} hint="Contacts, salary range, interview dates, anything you want to remember.">
                <textarea id="notes" rows={5} className="field resize-y" aria-invalid={!!errors.notes} {...register('notes')} />
            </FormField>

            {serverError && (
                <p role="alert" className="rounded-lg bg-st-rejected/10 px-3 py-2 text-sm text-st-rejected">
                    {serverError}
                </p>
            )}

            <div className="flex justify-end gap-3 pt-1">
                <button type="button" className="btn btn-secondary" onClick={onDone}>
                    Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={pending}>
                    {pending ? 'Saving…' : initial ? 'Save changes' : 'Add application'}
                </button>
            </div>
        </form>
    )
}