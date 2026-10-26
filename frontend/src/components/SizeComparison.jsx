import { formatBytes } from '../utils/canvasResize'

/**
 * Side-by-side comparison of original vs resized dimensions and file size,
 * plus a delta summary.
 */
export default function SizeComparison({ original, result }) {
  const hasResult = Boolean(result)
  const sizeDiff = hasResult ? result.size - original.size : 0
  const pct = original?.size ? (sizeDiff / original.size) * 100 : 0
  const smaller = sizeDiff < 0
  const same = sizeDiff === 0

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-zinc-700">Comparison</h3>

      <div className="grid grid-cols-2 gap-4">
        <Stat label="Original" dims={`${original.width} × ${original.height}px`} size={original.size} />
        <Stat
          label="Resized"
          dims={hasResult ? `${result.width} × ${result.height}px` : '—'}
          size={hasResult ? result.size : null}
        />
      </div>

      {hasResult && (
        <p
          className={[
            'mt-4 text-sm font-medium',
            same ? 'text-zinc-500' : smaller ? 'text-emerald-600' : 'text-amber-600',
          ].join(' ')}
        >
          {same
            ? 'No change in file size.'
            : smaller
              ? `Saved ${formatBytes(Math.abs(sizeDiff))} (${Math.abs(pct).toFixed(1)}% smaller)`
              : `+${formatBytes(sizeDiff)} (${pct.toFixed(1)}% larger)`}
        </p>
      )}
    </div>
  )
}

function Stat({ label, dims, size }) {
  return (
    <div className="rounded-xl bg-zinc-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-zinc-800">{dims}</p>
      <p className="text-sm text-zinc-500">{size != null ? formatBytes(size) : '—'}</p>
    </div>
  )
}
