import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

/**
 * Combined login + signup card. Shown as a modal overlay when the user clicks
 * "Log in" in the header or when the AI quota runs out for guests.
 *
 * @param {() => void} onClose  called when the user dismisses the panel
 * @param {'login'|'register'} [initialTab]
 */
export default function AuthPage({ onClose, initialTab = 'login' }) {
  const { login, register, loading } = useAuth()
  const [tab, setTab]         = useState(initialTab)
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]     = useState('')

  const isLogin = tab === 'login'

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      if (isLogin) await login(email, password)
      else         await register(email, password)
      onClose()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-xl">
        {/* Tabs */}
        <div className="mb-6 flex rounded-lg bg-zinc-100 p-1">
          <TabBtn active={isLogin}  onClick={() => { setTab('login');    setError('') }}>Log in</TabBtn>
          <TabBtn active={!isLogin} onClick={() => { setTab('register'); setError('') }}>Sign up</TabBtn>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor="auth-email" className="mb-1 block text-sm font-medium text-zinc-700">
              Email
            </label>
            <input
              id="auth-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label htmlFor="auth-password" className="mb-1 block text-sm font-medium text-zinc-700">
              Password {!isLogin && <span className="text-zinc-400 font-normal">(min 8 chars)</span>}
            </label>
            <input
              id="auth-password"
              type="password"
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
              minLength={isLogin ? undefined : 8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Please wait…' : isLogin ? 'Log in' : 'Create account'}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-zinc-500">
          {isLogin ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => { setTab(isLogin ? 'register' : 'login'); setError('') }}
            className="font-medium text-indigo-600 hover:underline"
          >
            {isLogin ? 'Sign up' : 'Log in'}
          </button>
        </p>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 text-zinc-400 hover:text-zinc-600"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  )
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex-1 rounded-md py-1.5 text-sm font-medium transition',
        active ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700',
      ].join(' ')}
    >
      {children}
    </button>
  )
}
