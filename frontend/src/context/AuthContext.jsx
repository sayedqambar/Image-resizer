import { createContext, useCallback, useEffect, useState } from 'react'
import { authApi } from '../services/authApi'

export const AuthContext = createContext(null)

const TOKEN_KEY = 'ir_token'
const EMAIL_KEY = 'ir_email'

/**
 * Provides auth state (token, email, usage) and actions (login, register, logout)
 * to the whole app. Token is persisted in localStorage so sessions survive a page reload.
 */
export function AuthProvider({ children }) {
  const [token, setToken]   = useState(() => localStorage.getItem(TOKEN_KEY) ?? null)
  const [email, setEmail]   = useState(() => localStorage.getItem(EMAIL_KEY) ?? null)
  const [usage, setUsage]   = useState(null)   // { dailyLimit, remaining, authenticated }
  const [loading, setLoading] = useState(false)

  // Fetch usage whenever the token changes (login/logout) or on first mount.
  const refreshUsage = useCallback(async (tok) => {
    const data = await authApi.getUsage(tok ?? null)
    if (data) setUsage(data)
  }, [])

  useEffect(() => { refreshUsage(token) }, [token, refreshUsage])

  const persist = (tok, em) => {
    setToken(tok); setEmail(em)
    if (tok) { localStorage.setItem(TOKEN_KEY, tok); localStorage.setItem(EMAIL_KEY, em) }
    else     { localStorage.removeItem(TOKEN_KEY);   localStorage.removeItem(EMAIL_KEY) }
  }

  const login = useCallback(async (em, pw) => {
    setLoading(true)
    try {
      const data = await authApi.login(em, pw)
      persist(data.token, data.email)
    } finally { setLoading(false) }
  }, [])

  const register = useCallback(async (em, pw) => {
    setLoading(true)
    try {
      const data = await authApi.register(em, pw)
      persist(data.token, data.email)
    } finally { setLoading(false) }
  }, [])

  const logout = useCallback(() => {
    persist(null, null)
    setUsage(null)
    refreshUsage(null)
  }, [refreshUsage])

  return (
    <AuthContext.Provider value={{ token, email, usage, loading, login, register, logout, refreshUsage }}>
      {children}
    </AuthContext.Provider>
  )
}
