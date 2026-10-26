/**
 * Auth + usage API calls.
 * All functions throw an Error with a human-readable message on failure.
 */

async function post(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(json.message || json.detail || `Request failed (${res.status})`)
  }
  return json
}

export const authApi = {
  register: (email, password) => post('/api/auth/register', { email, password }),
  login:    (email, password) => post('/api/auth/login',    { email, password }),

  async getUsage(token) {
    const res = await fetch('/api/usage', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!res.ok) return null
    return res.json()
  },
}
