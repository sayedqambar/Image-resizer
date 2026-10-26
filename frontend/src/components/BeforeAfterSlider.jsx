import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Interactive before/after comparison slider.
 *
 * Renders two images stacked; the top (after) image is clipped by a CSS
 * clip-path driven by the slider position. Drag the handle or click anywhere
 * on the container to move it.
 *
 * @param {string} beforeSrc  original image URL
 * @param {string} afterSrc   processed image URL
 * @param {string} [beforeLabel]
 * @param {string} [afterLabel]
 */
export default function BeforeAfterSlider({
  beforeSrc,
  afterSrc,
  beforeLabel = 'Before',
  afterLabel = 'After',
}) {
  const [pos, setPos] = useState(50) // 0–100 %
  const containerRef = useRef(null)
  const dragging = useRef(false)

  const updateFromEvent = useCallback((clientX) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100))
    setPos(pct)
  }, [])

  // Mouse
  const onMouseDown = useCallback(
    (e) => {
      e.preventDefault()
      dragging.current = true
      updateFromEvent(e.clientX)
    },
    [updateFromEvent],
  )
  useEffect(() => {
    const onMove = (e) => dragging.current && updateFromEvent(e.clientX)
    const onUp = () => { dragging.current = false }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [updateFromEvent])

  // Touch
  const onTouchStart = useCallback(
    (e) => updateFromEvent(e.touches[0].clientX),
    [updateFromEvent],
  )
  const onTouchMove = useCallback(
    (e) => { e.preventDefault(); updateFromEvent(e.touches[0].clientX) },
    [updateFromEvent],
  )

  return (
    <div
      ref={containerRef}
      className="relative select-none overflow-hidden rounded-xl bg-zinc-100"
      style={{ touchAction: 'none' }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
    >
      {/* Before (bottom) */}
      <img
        src={beforeSrc}
        alt={beforeLabel}
        draggable={false}
        className="block max-h-96 w-full object-contain"
      />

      {/* After (clipped to left of handle) */}
      <img
        src={afterSrc}
        alt={afterLabel}
        draggable={false}
        className="absolute inset-0 max-h-96 w-full object-contain"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      />

      {/* Divider line */}
      <div
        className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-lg"
        style={{ left: `${pos}%` }}
      />

      {/* Drag handle */}
      <div
        className="absolute top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-white shadow-lg ring-2 ring-white/60"
        style={{ left: `${pos}%` }}
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-zinc-500">
          <path d="M7 4l-3 6 3 6M13 4l3 6-3 6" stroke="currentColor" strokeWidth="1.5"
                fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Labels */}
      <span className="pointer-events-none absolute bottom-2 left-2 rounded bg-black/50 px-1.5 py-0.5 text-xs font-medium text-white">
        {beforeLabel}
      </span>
      <span className="pointer-events-none absolute bottom-2 right-2 rounded bg-black/50 px-1.5 py-0.5 text-xs font-medium text-white">
        {afterLabel}
      </span>
    </div>
  )
}
