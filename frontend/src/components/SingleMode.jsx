import { useCallback, useEffect, useRef, useState } from 'react'
import ImageDropzone from './ImageDropzone'
import ImagePreview from './ImagePreview'
import ResizeControls from './ResizeControls'
import PresetSelect from './PresetSelect'
import TransformButtons from './TransformButtons'
import FormatOptions from './FormatOptions'
import CropTool from './CropTool'
import SizeComparison from './SizeComparison'
import DownloadButton from './DownloadButton'
import AiToolsPanel from './AiToolsPanel'
import { resizeImage, cropImage, transformCanvas, mimeForType, createImage } from '../utils/canvasResize'

/**
 * Single-image mode.
 *
 * Processing pipeline:
 *   original (uploaded)
 *     → source  (working image — mutated by rotate/flip/crop/AI)
 *       → result (final browser-side encode with format + quality)
 *
 * The AI panel accepts the current source file, calls the backend, and hands the
 * result back via onUseAiResult. "Use as source" decodes the AI blob into a new
 * working image so the user can continue resizing, cropping, or downloading it.
 */
function computeTarget(settings, baseW, baseH) {
  if (settings.mode === 'percentage') {
    const f = settings.percentage / 100
    return {
      width: Math.max(1, Math.round(baseW * f)),
      height: Math.max(1, Math.round(baseH * f)),
    }
  }
  return { width: Math.max(1, settings.width), height: Math.max(1, settings.height) }
}

export default function SingleMode({ onLoginNeeded, initialPreset = null }) {
  const [original, setOriginal] = useState(null)
  const [source, setSource] = useState(null)
  const [sourceFile, setSourceFile] = useState(null)

  // If a landing-page preset was passed, start in pixel mode with that size.
  const defaultSettings = initialPreset
    ? { mode: 'pixels', width: initialPreset.width, height: initialPreset.height, percentage: 100, lockAspectRatio: false }
    : { mode: 'percentage', width: 0, height: 0, percentage: 100, lockAspectRatio: true }

  const [settings, setSettings] = useState(defaultSettings)
  const [format, setFormat] = useState('image/jpeg')
  const [quality, setQuality] = useState(0.92)
  const [result, setResult] = useState(null)        // { blob, url, width, height, size }
  const [isProcessing, setIsProcessing] = useState(false)
  const [cropOpen, setCropOpen] = useState(false)

  const originalRef = useRef(null)
  useEffect(() => { originalRef.current = original }, [original])

  // URL refs for unmount cleanup
  const originalUrlRef = useRef(null)
  const sourceUrlRef   = useRef(null)
  const resultUrlRef   = useRef(null)
  useEffect(() => { originalUrlRef.current = original?.url ?? null }, [original])
  useEffect(() => { sourceUrlRef.current   = source?.url   ?? null }, [source])
  useEffect(() => { resultUrlRef.current   = result?.url   ?? null }, [result])
  useEffect(() => () => {
    const o = originalUrlRef.current
    const s = sourceUrlRef.current
    const r = resultUrlRef.current
    if (r) URL.revokeObjectURL(r)
    if (s && s !== o) URL.revokeObjectURL(s)
    if (o) URL.revokeObjectURL(o)
  }, [])

  /** Replace the working source, revoking the previous URL if it isn't the original's. */
  const replaceSource = useCallback((next, file = null) => {
    setSource((prev) => {
      if (prev?.url && prev.url !== originalRef.current?.url) URL.revokeObjectURL(prev.url)
      return next
    })
    if (file !== null) setSourceFile(file)
  }, [])

  const handleImageSelected = useCallback((file) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      setOriginal((prev) => {
        if (prev?.url) URL.revokeObjectURL(prev.url)
        return { file, url, width: img.naturalWidth, height: img.naturalHeight, size: file.size, type: file.type }
      })
      setSource((prev) => {
        if (prev?.url && prev.url !== originalRef.current?.url) URL.revokeObjectURL(prev.url)
        return { url, imageEl: img, width: img.naturalWidth, height: img.naturalHeight }
      })
      setSourceFile(file)
      setResult((prev) => { if (prev?.url) URL.revokeObjectURL(prev.url); return null })
      setSettings({ mode: 'percentage', width: img.naturalWidth, height: img.naturalHeight, percentage: 100, lockAspectRatio: true })
      setFormat(mimeForType(file.type))
      setQuality(0.92)
      setCropOpen(false)
    }
    img.onerror = () => URL.revokeObjectURL(url)
    img.src = url
  }, [])

  // Sync resize settings when the source dimensions change (after rotate/flip/crop/AI).
  useEffect(() => {
    if (!source) return
    setSettings((prev) => {
      if (prev.mode === 'percentage') {
        const f = prev.percentage / 100
        return { ...prev, width: Math.max(1, Math.round(source.width * f)), height: Math.max(1, Math.round(source.height * f)) }
      }
      if (prev.lockAspectRatio) {
        return { ...prev, height: Math.max(1, Math.round((prev.width * source.height) / source.width)) }
      }
      return prev
    })
  }, [source])

  // Debounced canvas encode → result. Fires whenever source, settings, format, or quality change.
  useEffect(() => {
    if (!source) return
    const target = computeTarget(settings, source.width, source.height)
    if (target.width < 1 || target.height < 1) return

    let cancelled = false
    setIsProcessing(true)
    const timer = setTimeout(async () => {
      try {
        const res = await resizeImage(source.imageEl, target.width, target.height, format, quality)
        if (cancelled) { URL.revokeObjectURL(res.url); return }
        setResult((prev) => { if (prev?.url) URL.revokeObjectURL(prev.url); return res })
      } finally {
        if (!cancelled) setIsProcessing(false)
      }
    }, 250)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [source, settings, format, quality])

  const rotate = useCallback(async (dir) => {
    if (!source) return
    const next = await transformCanvas(source.imageEl, dir === 'right' ? 90 : -90, false, false)
    replaceSource(next)
  }, [source, replaceSource])

  const flip = useCallback(async (axis) => {
    if (!source) return
    const next = await transformCanvas(source.imageEl, 0, axis === 'h', axis === 'v')
    replaceSource(next)
  }, [source, replaceSource])

  const applyCrop = useCallback(async (pixels) => {
    if (!source) return
    const next = await cropImage(source.imageEl, pixels)
    replaceSource(next)
    setCropOpen(false)
  }, [source, replaceSource])

  const applyPreset = useCallback((preset) => {
    setSettings({ mode: 'pixels', width: preset.width, height: preset.height, percentage: 100, lockAspectRatio: false })
  }, [])

  /**
   * Called when the user clicks "Use as source" in the AI panel.
   * Decodes the AI blob into a new working image so downstream tools
   * (resize, crop, download) operate on the AI result.
   */
  const handleUseAiResult = useCallback(async ({ blob, url }) => {
    const img = await createImage(url)
    // Build a File from the blob so the AI panel can re-send it later if needed.
    const file = new File([blob], 'ai-result.png', { type: 'image/png' })
    replaceSource(
      { url, imageEl: img, width: img.naturalWidth, height: img.naturalHeight },
      file,
    )
  }, [replaceSource])

  const reset = useCallback(() => {
    setSource((prev) => { if (prev?.url && prev.url !== originalRef.current?.url) URL.revokeObjectURL(prev.url); return null })
    setOriginal((prev) => { if (prev?.url) URL.revokeObjectURL(prev.url); return null })
    setResult((prev) => { if (prev?.url) URL.revokeObjectURL(prev.url); return null })
    setSourceFile(null)
    setCropOpen(false)
  }, [])

  return (
    <>
      {!original ? (
        <div className="mx-auto max-w-2xl">
          <ImageDropzone onFiles={(files) => files[0] && handleImageSelected(files[0])} />
        </div>
      ) : (
        <div>
          <div className="mb-4 flex justify-end">
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
            >
              Choose another image
            </button>
          </div>

          {/* Row 1: original preview + resize controls */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ImagePreview
              label="Original"
              src={original.url}
              width={original.width}
              height={original.height}
              size={original.size}
            />
            <div className="flex flex-col gap-4">
              <PresetSelect onSelect={applyPreset} />
              <ResizeControls
                baseWidth={source.width}
                baseHeight={source.height}
                settings={settings}
                onChange={setSettings}
              />
            </div>
          </div>

          {/* Row 2: geometric adjust + export format */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <TransformButtons onRotate={rotate} onFlip={flip} onCrop={() => setCropOpen(true)} />
            <FormatOptions format={format} onFormatChange={setFormat} quality={quality} onQualityChange={setQuality} />
          </div>

          {/* Row 3: AI Tools */}
          {sourceFile && (
            <div className="mt-6">
              <AiToolsPanel
                sourceFile={sourceFile}
                sourceUrl={source.url}
                onUseResult={handleUseAiResult}
                onLoginNeeded={onLoginNeeded}
              />
            </div>
          )}

          {/* Row 4: resized result + comparison + download */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <ImagePreview
              label="Resized"
              src={result?.url}
              width={result?.width}
              height={result?.height}
              size={result?.size}
              footer={isProcessing ? <span className="text-xs text-indigo-500">processing…</span> : null}
            />
            <div className="flex flex-col gap-4">
              <SizeComparison original={original} result={result} />
              <DownloadButton result={result} originalName={original.file.name} isProcessing={isProcessing} />
            </div>
          </div>
        </div>
      )}

      {cropOpen && source && (
        <CropTool imageSrc={source.url} onApply={applyCrop} onCancel={() => setCropOpen(false)} />
      )}
    </>
  )
}
