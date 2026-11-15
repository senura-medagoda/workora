import { Link } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

const features = [
    { title: 'Track every application', text: 'Company, role, date, link and notes, all in one place.' },
    { title: 'Know where you stand', text: 'Move applications from Applied to Interviewing, Offer or Rejected in one click.' },
    { title: 'Private by design', text: 'Your data is yours. Every request is authenticated and scoped to your account.' },
]

export default function LandingPage() {
    const { user } = useAuth()

    return (
        <div className="min-h-screen bg-white text-slate-800">
            <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/90 backdrop-blur">
                <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
                    <a href="#home" className="text-xl font-bold text-indigo-600">
                        Workora
                    </a>
                    <div className="flex items-center gap-6 text-sm font-medium">
                        <a href="#home" className="hover:text-indigo-600">Home</a>
                        <a href="#about" className="hover:text-indigo-600">About</a>
                        {user ? (
                            <Link to="/dashboard" className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500">
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link to="/login" className="hover:text-indigo-600">Log in</Link>
                                <Link to="/register" className="rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-500">
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                </nav>
            </header>

            <main>
                <section id="home" className="mx-auto max-w-5xl px-4 py-24 text-center">
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
                        Stop losing track of your <span className="text-indigo-600">job search</span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
                        Workora helps you log every application, follow its progress and never miss a follow-up.
                    </p>
                    <div className="mt-10 flex justify-center gap-4">
                        <Link to={user ? '/dashboard' : '/register'} className="rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-500">
                            {user ? 'Go to dashboard' : 'Get started free'}
                        </Link>
                        {!user && (
                            <Link to="/login" className="rounded-lg border border-slate-300 px-6 py-3 font-semibold hover:bg-slate-50">
                                Log in
                            </Link>
                        )}
                    </div>
                </section>

                <section className="bg-slate-50 py-16">
                    <div className="mx-auto grid max-w-5xl gap-6 px-4 sm:grid-cols-3">
                        {features.map((f) => (
                            <div key={f.title} className="rounded-2xl bg-white p-6 shadow-sm">
                                <h3 className="font-semibold text-slate-900">{f.title}</h3>
                                <p className="mt-2 text-sm text-slate-600">{f.text}</p>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="about" className="mx-auto max-w-3xl px-4 py-24">
                    <h2 className="text-3xl font-bold text-slate-900">About Workora</h2>
                    <p className="mt-4 text-slate-600">
                        Workora is a full-stack job application tracker built with Spring Boot, PostgreSQL and React.
                        It uses short-lived JWT access tokens with rotating refresh tokens, so your account stays
                        secure without constant logins.
                    </p>
                </section>
            </main>

            <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">
                © {new Date().getFullYear()} Workora
            </footer>
        </div>
    )
}