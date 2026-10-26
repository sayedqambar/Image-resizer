/**
 * Thin fetch wrappers for the Spring Boot AI proxy endpoints.
 *
 * Every function resolves with a { blob, url } on success (a fresh object URL
 * the caller must revoke). On failure it throws an Error whose `message` is the
 * human-readable string from the backend's ApiError JSON.
 *
 * Pass the JWT token (from AuthContext) so registered users get their higher
 * quota. Anonymous callers pass null/undefined.
 */

const BASE = '/api/ai'

async function extractMessage(res) {
  try {
    const body = await res.json()
    return body?.message || body?.detail || `Server error (${res.status})`
  } catch {
    return `Request failed (${res.status})`
  }
}

async function postImage(path, file, extraFields = {}, token = null) {
  const form = new FormData()
  form.append('file', file)
  Object.entries(extraFields).forEach(([k, v]) => form.append(k, String(v)))

  const headers = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: form })
  } catch (err) {
    throw new Error(
      err?.message?.includes('Failed to fetch')
        ? 'Cannot reach the server. Is the backend running?'
        : `Network error: ${err.message}`,
    )
  }

  if (!res.ok) {
    const msg = await extractMessage(res)
    const err = new Error(msg)
    err.status = res.status
    throw err
  }

  const blob = await res.blob()
  return { blob, url: URL.createObjectURL(blob) }
}

export const aiApi = {
  removeBackground: (file, token) => postImage('/remove-background', file, {}, token),
  upscale:          (file, scale, token) => postImage('/upscale', file, { scale }, token),
  smartCrop:        (file, width, height, token) =>
    postImage('/smart-crop', file, { width, height }, token),
}
