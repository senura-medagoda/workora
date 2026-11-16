import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiFetch } from './client'
import type { ApplicationInput, ApplicationStats, ApplicationStatus, JobApplication, Page } from './types'

export const PAGE_SIZE = 10

export function useApplications(status: ApplicationStatus | null, page: number) {
    return useQuery({
        queryKey: ['applications', { status, page }],
        queryFn: () => {
            const params = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) })
            if (status) params.set('status', status)
            return apiFetch<Page<JobApplication>>(`/applications?${params}`)
        },
        placeholderData: keepPreviousData, // keep showing the old page while the next one loads: no flicker
    })
}

export function useStats() {
    return useQuery({
        queryKey: ['application-stats'],
        queryFn: () => apiFetch<ApplicationStats>('/applications/stats'),
    })
}

/** After any change, mark both the list and the stats as stale so they refetch. */
function useRefreshData() {
    const queryClient = useQueryClient()
    return () =>
        Promise.all([
            queryClient.invalidateQueries({ queryKey: ['applications'] }),
            queryClient.invalidateQueries({ queryKey: ['application-stats'] }),
        ])
}

export function useCreateApplication() {
    const refresh = useRefreshData()
    return useMutation({
        mutationFn: (data: ApplicationInput) =>
            apiFetch<JobApplication>('/applications', { method: 'POST', body: JSON.stringify(data) }),
        onSuccess: refresh,
    })
}

export function useUpdateApplication() {
    const refresh = useRefreshData()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: ApplicationInput }) =>
            apiFetch<JobApplication>(`/applications/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
        onSuccess: refresh,
    })
}

export function useChangeStatus() {
    const refresh = useRefreshData()
    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: ApplicationStatus }) =>
            apiFetch<JobApplication>(`/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
        onSuccess: refresh,
    })
}

export function useDeleteApplication() {
    const refresh = useRefreshData()
    return useMutation({
        mutationFn: (id: string) => apiFetch<void>(`/applications/${id}`, { method: 'DELETE' }),
        onSuccess: refresh,
    })
}