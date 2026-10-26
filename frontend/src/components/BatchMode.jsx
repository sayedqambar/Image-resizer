import { useCallback, useEffect, useRef, useState } from 'react'
import JSZip from 'jszip'
import ImageDropzone from './ImageDropzone'
import PresetSelect from './PresetSelect'
import BatchResizeControls from './BatchResizeControls'
import FormatOptions from './FormatOptions'
import BatchItemList from './BatchItemList'
import ProgressBar from './ProgressBar'
import { createImage, resizeImage, formatBytes, extensionFor } from '../utils/canvasResize'

/**
 * Batch mode: upload many images, apply the same resize/format/quality settings to
 * all of them, view a thumbnail list with before/after sizes, and download every
 * result as a ZIP. All processing happens in the browser; a progress bar tracks it.
 *
 * settings: { mode: 'percentage' | 'pixels', width, height, percentage }
 */
function computeBatchTarget(settings, w, h) {
  if (settings.mode === 'percentage') {
    const f = settings.percentage / 100
    return { width: Math.max(1, Math.round(w * f)), height: Math.max(1, Math.round(h * f)) }
  }
  return { width: Math.max(1, settings.width), height: Math.max(1, settings.height) }
}

export default function BatchMode() {
  const [items, setItems] = useState([]) // [{ id, file, originalUrl, width, height, size, type }]
  const [settings, setSettings] = useState({ mode: 'percentage', width: 0, height: 0, percentage: 100 })
  const [format, setFormat] = useState('image/jpeg')
  const [quality, setQuality] = useState(0.92)
  const [results, setResults] = useState({}) // { [id]: { url, blob, width, height, size } }
  const [processing, setProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [label, setLabel] = useState('')
  const [zipping, setZipping] = useState(false)
  const [zipPct, setZipPct] = useState(0)

  const idRef = useRef(0)
  const runIdRef = useRef(0)

  // refs for unmount cleanup
  const itemsRef = useRef([])
  const resultsRef = useRef({})
  useEffect(() => {
    itemsRef.current = items
  }, [items])
  useEffect(() => {
    resultsRef.current = results
  }, [results])
  useEffect(
    () => () => {
      itemsRef.current.forEach((it) => it?.originalUrl && URL.revokeObjectURL(it.originalUrl))
      Object.values(resultsRef.current).forEach((r) => r?.url && URL.revokeObjectURL(r.url))
    },
    [],
  )

  const addItems = useCallback(async (files) => {
    const slots = new Array(files.length)
    await Promise.all(
      files.map(async (file, i) => {
        const url = URL.createObjectURL(file)
        try {
          const img = await createImage(url)
          slots[i] = {
            id: idRef.current++,
            file,
            originalUrl: url,
            width: img.naturalWidth,
            height: img.naturalHeight,
            size: file.size,
            type: file.type,
          }
        } catch {
          URL.revokeObjectURL(url)
        }
      }),
    )
    const decoded = slots.filter(Boolean)
    if (decoded.length) setItems((prev) => [...prev, ...decoded])
  }, [])

  const removeItem = useCallback((id) => {
    setItems((prev) => {
      const item = prev.find((x) => x.id === id)
      if (item?.originalUrl) URL.revokeObjectURL(item.originalUrl)
      return prev.filter((x) => x.id !== id)
    })
    setResults((prev) => {
      if (prev[id]?.url) URL.revokeObjectURL(prev[id].url)
      const next = { ...prev }
      delete next[id]
      return next
    })
  }, [])

  const clearAll = useCallback(() => {
    setItems((prev) => {
      prev.forEach((it) => it?.originalUrl && URL.revokeObjectURL(it.originalUrl))
      return []
    })
    setResults((prev) => {
      Object.values(prev).forEach((r) => r?.url && URL.revokeObjectURL(r.url))
      return {}
    })
    setProcessing(false)
    setProgress(0)
    setLabel('')
  }, [])

  const applyBatchPreset = useCallback((preset) => {
    setSettings({ mode: 'pixels', width: preset.width, height: preset.height, percentage: 100 })
  }, [])

  // Process all images whenever inputs change. Sequential, with a run id so a
  // settings change cancels the in-flight pass and starts a fresh one.
  useEffect(() => {
    if (!items.length) {
      setResults((prev) => {
        Object.values(prev).forEach((r) => r?.url && URL.revokeObjectURL(r.url))
        return {}
      })
      setProcessing(false)
      setProgress(0)
      setLabel('')
      return
    }

    const runId = ++runIdRef.current
    const currentIds = new Set(items.map((i) => i.id))

    // prune results for removed items, keep the rest (replaced per-item below)
    setResults((prev) => {
      const next = {}
      Object.entries(prev).forEach(([id, r]) => {
        if (currentIds.has(Number(id))) next[id] = r
        else if (r?.url) URL.revokeObjectURL(r.url)
      })
      return next
    })

    setProcessing(true)
    setProgress(0)
    setLabel(`Processing 0 of ${items.length}`)

    const timer = setTimeout(async () => {
      const total = items.length
      for (let i = 0; i < total; i++) {
        if (runIdRef.current !== runId) return // superseded by a newer pass
        const item = items[i]
        try {
          const img = await createImage(item.originalUrl)
          if (runIdRef.current !== runId) return
          const target = computeBatchTarget(settings, item.width, item.height)
          if (target.width < 1 || target.height < 1) continue
          const res = await resizeImage(img, target.width, target.height, format, quality)
          if (runIdRef.current !== runId) {
            URL.revokeObjectURL(res.url)
            return
          }
          setResults((prev) => {
            const old = prev[item.id]
            if (old?.url) URL.revokeObjectURL(old.url)
            return { ...prev, [item.id]: res }
          })
          setProgress(Math.round(((i + 1) / total) * 100))
          setLabel(`Processing ${i + 1} of ${total}`)
        } catch {
          // skip a failed image but keep going
        }
      }
      if (runIdRef.current === runId) {
        setProcessing(false)
        setLabel('')
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [items, settings, format, quality])

  const downloadZip = useCallback(async () => {
    if (!items.length) return
    const zip = new JSZip()
    const used = new Set()
    items.forEach((item) => {
      const res = results[item.id]
      if (!res) return
      const base = item.file.name.replace(/\.[^.]+$/, '') || 'image'
      const ext = extensionFor(res.blob.type)
      let name = `${base}_${res.width}x${res.height}.${ext}`
      let n = 1
      while (used.has(name)) {
        name = `${base}_${res.width}x${res.height}_${n}.${ext}`
        n += 1
      }
      used.add(name)
      zip.file(name, res.blob)
    })

    setZipping(true)
    setZipPct(0)
    try {
      const blob = await zip.generateAsync({ type: 'blob' }, (meta) =>
        setZipPct(Math.round(meta.percent)),
      )
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'resized-images.zip'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setZipping(false)
      setZipPct(0)
    }
  }, [items, results])

  const totalOriginal = items.reduce((s, it) => s + it.size, 0)
  const totalResized = items.reduce((s, it) => s + (results[it.id]?.size ?? 0), 0)
  const hasResults = Object.keys(results).length > 0

  return (
    <div>
      <div className="mx-auto max-w-2xl">
        <ImageDropzone multiple onFiles={addItems} />
      </div>

      {items.length > 0 && (
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-500">
              {items.length} image{items.length !== 1 ? 's' : ''} · {formatBytes(totalOriginal)}
              {hasResults ? ` → ${formatBytes(totalResized)}` : ' → …'}
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
            >
              Clear all
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="flex flex-col gap-4">
              <PresetSelect onSelect={applyBatchPreset} />
              <BatchResizeControls settings={settings} onChange={setSettings} />
              <FormatOptions
                format={format}
                onFormatChange={setFormat}
                quality={quality}
                onQualityChange={setQuality}
              />
            </div>

            <div className="flex flex-col gap-4">
              {processing && <ProgressBar value={progress} label={label} />}

              <BatchItemList items={items} results={results} onRemove={removeItem} />

              <button
                type="button"
                onClick={downloadZip}
                disabled={processing || zipping || !hasResults}
                className={[
                  'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
                  processing || zipping || !hasResults
                    ? 'cursor-not-allowed bg-zinc-200 text-zinc-400'
                    : 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700',
                ].join(' ')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                  <path d="M12 4v12m0 0l-4-4m4 4l4-4" />
                  <path d="M4 18h16" />
                </svg>
                {zipping ? `Zipping ${zipPct}%` : 'Download all (ZIP)'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
