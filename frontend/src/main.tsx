import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import '@fontsource-variable/bricolage-grotesque'
import '@fontsource-variable/instrument-sans'
import './index.css'
import App from './App'
import { ApiError } from './api/client'
import { AuthProvider } from './auth/AuthProvider'
import { ToastProvider } from './toast/ToastProvider'

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            // retrying a 4xx (bad request, not found) can never help; retry only network/server errors, twice
            retry: (failureCount, error) => !(error instanceof ApiError && error.status < 500) && failureCount < 2,
        },
    },
})

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                <ToastProvider>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </ToastProvider>
            </QueryClientProvider>
        </BrowserRouter>
    </StrictMode>,
)