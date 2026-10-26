import { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function PrivacyPage() {
  useEffect(() => {
    document.title = 'Privacy Policy — Image Resizer'
  }, [])

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="border-b border-zinc-200 bg-white px-4 py-4">
        <div className="mx-auto max-w-3xl flex items-center gap-4">
          <Link to="/" className="text-xl font-bold tracking-tight hover:text-indigo-600">Image Resizer</Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-extrabold mb-6 text-zinc-900">Privacy Policy</h1>

        <div className="prose prose-zinc max-w-none space-y-6 text-sm text-zinc-700 leading-relaxed">
          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">How your images are handled</h2>
            <p>
              <strong>Basic resizing, cropping, rotating, and format conversion</strong> all happen
              entirely in your browser using the Canvas API. Your image bytes never leave your device
              for these operations.
            </p>
            <p className="mt-2">
              <strong>AI features</strong> (background removal, upscaling, smart crop) require sending
              your image to our server so the ML model can process it. Here is exactly what happens:
            </p>
            <ol className="mt-2 list-decimal list-inside space-y-1">
              <li>Your image is transmitted over HTTPS to our API.</li>
              <li>It is written to a temporary directory on the server.</li>
              <li>The AI model processes it and the result is returned to your browser.</li>
              <li><strong>The temporary file is deleted immediately after the result is sent</strong> — before the HTTP response is complete. There is no delay, no background job, no archive.</li>
            </ol>
            <p className="mt-2">
              We do not store, log, share, sell, or analyse the content of any uploaded image.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">Account data</h2>
            <p>
              If you create an account, we store your email address and a BCrypt hash of your password.
              We do not store your password in plain text. We do not share your email with third parties.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">Usage logs</h2>
            <p>
              To enforce daily usage limits we store the number of AI calls made per user per day (or
              per IP address for anonymous users). These logs contain: user id or IP address, which AI
              tool was called, and a timestamp. They do not contain image data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">Cookies &amp; local storage</h2>
            <p>
              We store your JWT authentication token in <code>localStorage</code> so you stay logged in
              across browser sessions. No third-party cookies or trackers are used.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-zinc-800 mb-2">Contact</h2>
            <p>Questions about privacy? Open an issue on our GitHub repository.</p>
          </section>
        </div>
      </main>

      <footer className="border-t border-zinc-200 bg-white py-6 text-center text-xs text-zinc-400">
        <Link to="/" className="hover:text-zinc-600">← Back to Image Resizer</Link>
      </footer>
    </div>
  )
}
