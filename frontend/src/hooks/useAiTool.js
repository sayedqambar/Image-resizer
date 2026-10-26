import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Manages the lifecycle of a single AI tool call.
 *
 * Returns:
 *   status   – 'idle' | 'loading' | 'success' | 'error'
 *   result   – { blob, url } on success, null otherwise
 *   error    – error message string, null otherwise
 *   run(fn)  – call with an async () => { blob, url } factory; handles state + cleanup
 *   reset()  – revoke the result URL and go back to idle
 */
export function useAiTool() {
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  // Keep a ref to the current result URL so the cleanup effect can revoke it.
  const resultUrlRef = useRef(null)
  useEffect(() => {
    resultUrlRef.current = result?.url ?? null
  }, [result])

  // Revoke object URL on unmount.
  useEffect(() => () => {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current)
  }, [])

  const run = useCallback(async (apiFn) => {
    // Revoke any previous result before starting a new call.
    setResult((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url)
      return null
    })
    setError(null)
    setStatus('loading')
    try {
      const res = await apiFn()
      setResult(res)
      setStatus('success')
    } catch (err) {
      setError(err.message ?? 'An unexpected error occurred.')
      setStatus('error')
    }
  }, [])

  const reset = useCallback(() => {
    setResult((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url)
      return null
    })
    setError(null)
    setStatus('idle')
  }, [])

  return { status, result, error, run, reset }
}
