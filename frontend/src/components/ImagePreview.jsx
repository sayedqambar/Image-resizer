import { formatBytes } from '../utils/canvasResize'

/**
 * Reusable image preview card. Shows the image, its dimensions, and file size.
 * Used for both the original and the resized result.
 */
export default function ImagePreview({ src, label, width, height, size, footer }) {
  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-700">{label}</h3>
        {width && height ? (
          <span className="text-xs text-zinc-500">
            {width} × {height}px
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 items-center justify-center overflow-hidden rounded-lg bg-zinc-50 p-2">
        {src ? (
          <img
            src={src}
            alt={label}
            className="max-h-72 w-auto max-w-full object-contain"
          />
        ) : (
          <div className="py-12 text-sm text-zinc-400">No image yet</div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        {size != null ? (
          <span className="text-sm text-zinc-500">{formatBytes(size)}</span>
        ) : (
          <span className="text-sm text-zinc-400">—</span>
        )}
        {footer}
      </div>
    </div>
  )
}
