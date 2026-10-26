import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext'
import SingleMode from '../components/SingleMode'
import UsageBar from '../components/UsageBar'
import AuthPage from '../components/AuthPage'
import { useAuth } from '../hooks/useAuth'
import { useState } from 'react'

/**
 * SEO landing page for a specific use case (e.g. "Resize image to 1080x1080").
 *
 * Props injected by the route definition:
 *   title        – page <title> and H1
 *   description  – <meta name="description">
 *   headline     – hero sentence below the H1
 *   preset       – { width, height } OR null (size-reduction page uses null)
 *   faqs         – [{ q, a }] shown below the tool
 */
export default function LandingPage({ title, description, headline, preset, faqs }) {
  // Inject meta tags into <head> — Vite SSG not available, so we do it client-side.
  useEffect(() => {
    document.title = title
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) { meta = document.createElement('meta'); meta.name = 'description'; document.head.appendChild(meta) }
    meta.content = description

    // canonical
    let canon = document.querySelector('link[rel="canonical"]')
    if (!canon) { canon = document.createElement('link'); canon.rel = 'canonical'; document.head.appendChild(canon) }
    canon.href = window.location.origin + window.location.pathname
  }, [title, description])

  return (
    <AuthProvider>
      <LandingShell title={title} headline={headline} preset={preset} faqs={faqs} />
    </AuthProvider>
  )
}

function LandingShell({ title, headline, preset, faqs }) {
  const { email, logout } = useAuth()
  const [authOpen, setAuthOpen] = useState(false)
  const isLoggedIn = Boolean(email)

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <Link to="/" className="text-xl font-bold tracking-tight hover:text-indigo-600 transition">
            Image Resizer
          </Link>
          <nav className="hidden sm:flex items-center gap-5 text-sm text-zinc-600">
            <Link to="/resize-image-1080x1080" className="hover:text-zinc-900">Instagram 1080×1080</Link>
            <Link to="/resize-image-1280x720"  className="hover:text-zinc-900">YouTube 1280×720</Link>
            <Link to="/reduce-image-size"       className="hover:text-zinc-900">Reduce size</Link>
          </nav>
          <div className="flex items-center gap-3">
            <UsageBar onLoginClick={() => setAuthOpen(true)} />
            {isLoggedIn
              ? <button type="button" onClick={logout} className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50">Log out</button>
              : <button type="button" onClick={() => setAuthOpen(true)} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">Log in</button>
            }
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="bg-white border-b border-zinc-200 py-10">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-lg text-zinc-500">{headline}</p>
            <PrivacyNote />
          </div>
        </section>

        {/* The actual tool, pre-loaded with the preset */}
        <section className="mx-auto max-w-5xl px-4 py-8">
          <SingleMode
            initialPreset={preset}
            onLoginNeeded={() => setAuthOpen(true)}
          />
        </section>

        {/* FAQ */}
        {faqs?.length > 0 && (
          <section className="bg-white border-t border-zinc-200 py-12">
            <div className="mx-auto max-w-3xl px-4">
              <h2 className="mb-6 text-xl font-bold text-zinc-900">Frequently asked questions</h2>
              <dl className="space-y-6">
                {faqs.map((faq, i) => (
                  <div key={i}>
                    <dt className="font-semibold text-zinc-800">{faq.q}</dt>
                    <dd className="mt-1 text-sm text-zinc-600">{faq.a}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </section>
        )}

        {/* Internal links */}
        <section className="border-t border-zinc-200 bg-zinc-50 py-10">
          <div className="mx-auto max-w-5xl px-4">
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">Other tools</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {LANDING_PAGES.map((p) => (
                <Link
                  key={p.path}
                  to={p.path}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-700"
                >
                  {p.linkLabel}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      {authOpen && <AuthPage onClose={() => setAuthOpen(false)} />}
    </div>
  )
}

export function PrivacyNote() {
  return (
    <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-4 py-1.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd"/>
      </svg>
      Your files are processed locally and never stored on our servers.
    </p>
  )
}

function Footer() {
  return (
    <footer className="border-t border-zinc-200 bg-white py-8 text-center text-xs text-zinc-400">
      <p>© {new Date().getFullYear()} Image Resizer &mdash; Free online image resizer.</p>
      <p className="mt-1">
        All processing runs in your browser. For AI features, files are sent to our server,
        processed, and <strong>automatically deleted immediately</strong> after your result is returned.
        We never store, share, or analyse your images.
      </p>
      <div className="mt-3 flex justify-center gap-4">
        <Link to="/privacy" className="hover:text-zinc-600">Privacy</Link>
        <a href="/sitemap.xml" className="hover:text-zinc-600">Sitemap</a>
      </div>
    </footer>
  )
}

/** Shared list — used for internal link grids on every landing page. */
export const LANDING_PAGES = [
  { path: '/resize-image-1080x1080', linkLabel: 'Resize to 1080×1080 (Instagram)' },
  { path: '/resize-image-1280x720',  linkLabel: 'Resize to 1280×720 (YouTube thumbnail)' },
  { path: '/resize-image-1584x396',  linkLabel: 'Resize to 1584×396 (LinkedIn banner)' },
  { path: '/resize-image-500x500',   linkLabel: 'Resize to 500×500 (WhatsApp DP)' },
  { path: '/resize-image-413x531',   linkLabel: 'Resize to 413×531 (Passport photo)' },
  { path: '/reduce-image-size',      linkLabel: 'Reduce image file size' },
]
