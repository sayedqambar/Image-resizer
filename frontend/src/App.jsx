import { lazy, Suspense, useState } from 'react'
import { Routes, Route, Link, NavLink } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import SingleMode from './components/SingleMode'
import BatchMode from './components/BatchMode'
import UsageBar from './components/UsageBar'
import AuthPage from './components/AuthPage'
import LandingPage, { PrivacyNote, LANDING_PAGES } from './pages/LandingPage'
import PrivacyPage from './pages/PrivacyPage'

/**
 * App root. BrowserRouter is in main.jsx. Every route that needs auth state is
 * inside AuthProvider, which is also the root here.
 */
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* ── Main tool ── */}
        <Route path="/" element={<AppShell />} />

        {/* ── Preset landing pages ── */}
        <Route path="/resize-image-1080x1080" element={
          <LandingPage
            title="Resize Image to 1080x1080 — Free Instagram Photo Resizer"
            description="Resize any image to exactly 1080×1080 pixels for Instagram posts — free, instant, no upload required. Works in your browser."
            headline="Perfect square for Instagram posts. Resize in one click, download instantly."
            preset={{ width: 1080, height: 1080 }}
            faqs={[
              { q: 'Why is 1080×1080 the right size for Instagram?', a: 'Instagram displays square posts at 1080×1080. Uploading at this exact size avoids automatic recompression and keeps your image sharp.' },
              { q: 'Do I need to create an account?', a: 'No. Basic resizing is free and needs no account. AI features (background removal, upscaling) require an account for more than 2 uses per day.' },
              { q: 'Is my photo uploaded to a server?', a: 'No. Resizing happens entirely in your browser using the Canvas API. Your image never leaves your device.' },
            ]}
          />
        } />

        <Route path="/resize-image-1280x720" element={
          <LandingPage
            title="Resize Image to 1280x720 — YouTube Thumbnail Resizer"
            description="Create a perfect YouTube thumbnail by resizing your image to 1280×720 pixels. Free, browser-based, no signup needed."
            headline="The standard YouTube thumbnail size. Resize your image in seconds."
            preset={{ width: 1280, height: 720 }}
            faqs={[
              { q: 'Why does YouTube recommend 1280×720?', a: "YouTube's recommended thumbnail resolution is 1280×720 (16:9 aspect ratio). It's the minimum resolution where your thumbnail looks sharp on all devices." },
              { q: 'What file format should I use for YouTube thumbnails?', a: 'JPG or WebP are best for thumbnails — they produce smaller files at good quality. Select the format in the Export Format panel before downloading.' },
              { q: 'Can I upscale a small image to 1280×720?', a: 'Yes. Use the AI Upscale 2× or 4× button first to increase resolution before resizing. This produces a much sharper thumbnail than plain upscaling.' },
            ]}
          />
        } />

        <Route path="/resize-image-1584x396" element={
          <LandingPage
            title="Resize Image to 1584x396 — LinkedIn Banner Resizer"
            description="Resize your image to 1584×396 pixels for a LinkedIn profile banner. Free, instant, works in your browser."
            headline="The exact LinkedIn profile banner dimensions — ready in seconds."
            preset={{ width: 1584, height: 396 }}
            faqs={[
              { q: 'What are the correct LinkedIn banner dimensions?', a: 'LinkedIn recommends 1584×396 pixels for profile banners (approximately 4:1 aspect ratio). Using the exact size prevents cropping on any device.' },
              { q: 'My banner looks stretched — why?', a: "Fitting a non-4:1 image into 1584×396 will stretch it. Use the Smart Crop AI tool to crop to the 4:1 ratio before resizing, or use the tool's crop feature." },
            ]}
          />
        } />

        <Route path="/resize-image-500x500" element={
          <LandingPage
            title="Resize Image to 500x500 — WhatsApp DP Resizer"
            description="Resize your photo to 500×500 pixels for a WhatsApp profile picture. Free, no account needed, stays on your device."
            headline="Perfect square for WhatsApp display pictures. No quality loss."
            preset={{ width: 500, height: 500 }}
            faqs={[
              { q: 'What size should a WhatsApp profile picture be?', a: 'WhatsApp displays profile pictures at 500×500 pixels. Resizing to this exact size prevents WhatsApp from compressing it further.' },
              { q: 'Will this work for Telegram too?', a: 'Yes. Telegram also uses square profile pictures. 500×500 works well.' },
            ]}
          />
        } />

        <Route path="/resize-image-413x531" element={
          <LandingPage
            title="Resize Image to 413x531 — Passport Photo Resizer"
            description="Resize your photo to the standard 413×531 pixel passport photo size. Free, instant, secure — nothing is uploaded."
            headline="Standard passport photo dimensions (35×45 mm at 300 DPI)."
            preset={{ width: 413, height: 531 }}
            faqs={[
              { q: 'What are the standard passport photo dimensions?', a: 'Most countries require a 35×45 mm (or 2×2 inch) passport photo. At 300 DPI that is 413×531 pixels. Always verify with your specific country\'s authority.' },
              { q: 'Can I remove the background for a passport photo?', a: 'Yes — use the AI Remove Background button to get a transparent PNG, then change the background to white before downloading.' },
            ]}
          />
        } />

        <Route path="/reduce-image-size" element={
          <LandingPage
            title="Reduce Image File Size — Compress Images Free"
            description="Reduce the file size of your JPG, PNG or WebP image for free. Adjust quality with the slider. Works in your browser with no upload."
            headline="Drag the quality slider to compress. See the before/after file size live."
            preset={null}
            faqs={[
              { q: 'How do I reduce an image below 100 KB?', a: 'Upload your image, switch to JPG or WebP format (more efficient than PNG), and drag the quality slider left. The file size updates live so you can hit your target precisely.' },
              { q: 'Does reducing quality make my image look bad?', a: 'For most images, quality 70–85% is visually indistinguishable from 100% at a fraction of the file size. The before/after comparison helps you judge.' },
              { q: 'What is the difference between PNG and JPG?', a: 'PNG is lossless (larger files, perfect quality). JPG is lossy (smaller files, slight quality reduction). For photos, JPG at 80–90% quality is usually the right choice.' },
              { q: 'Can I compress many images at once?', a: 'Yes — use Batch mode on the home page to upload many images and download all results as a ZIP.' },
            ]}
          />
        } />

        {/* ── Privacy ── */}
        <Route path="/privacy" element={<PrivacyPage />} />

        {/* ── 404 ── */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  )
}

/* ─────────────────────────────── Main shell (home page) ────────────────── */

function AppShell() {
  const { email, logout } = useAuth()
  const [mode, setMode]   = useState('single')
  const [authOpen, setAuthOpen] = useState(false)

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Image Resizer</h1>
            <p className="mt-0.5 text-xs text-zinc-500">
              Resize, crop, rotate, convert — in your browser. Nothing is uploaded unless you use AI.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <UsageBar onLoginClick={() => setAuthOpen(true)} />
            {email
              ? <button type="button" onClick={logout} className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50">Log out</button>
              : <button type="button" onClick={() => setAuthOpen(true)} className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700">Log in</button>
            }
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 inline-flex rounded-lg bg-zinc-100 p-1">
          <ModeButton active={mode === 'single'} onClick={() => setMode('single')}>Single</ModeButton>
          <ModeButton active={mode === 'batch'}  onClick={() => setMode('batch')}>Batch</ModeButton>
        </div>

        {mode === 'single'
          ? <SingleMode onLoginNeeded={() => setAuthOpen(true)} />
          : <BatchMode />}
      </main>

      {/* Privacy note */}
      <div className="mx-auto max-w-5xl px-4 pb-4">
        <PrivacyNote />
      </div>

      {/* Landing page link grid */}
      <section className="border-t border-zinc-200 bg-white py-8">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Common resize presets
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {LANDING_PAGES.map((p) => (
              <Link
                key={p.path}
                to={p.path}
                className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700 transition hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
              >
                {p.linkLabel}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-white py-6 text-center text-xs text-zinc-400">
        <p>
          Files are processed locally. AI features send your image to our server and&nbsp;
          <strong>automatically delete it</strong> after processing.&nbsp;
          <Link to="/privacy" className="underline hover:text-zinc-600">Privacy policy</Link>.
        </p>
      </footer>

      {authOpen && <AuthPage onClose={() => setAuthOpen(false)} />}
    </div>
  )
}

function ModeButton({ active, onClick, children }) {
  return (
    <button type="button" onClick={onClick}
      className={['rounded-md px-4 py-1.5 text-sm font-medium transition',
        active ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'].join(' ')}>
      {children}
    </button>
  )
}

function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-zinc-600">
      <p className="text-5xl font-black text-zinc-300">404</p>
      <p className="text-lg font-semibold">Page not found</p>
      <Link to="/" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">Go home</Link>
    </div>
  )
}
