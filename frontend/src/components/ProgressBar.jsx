/**
 * Simple indeterminate-to-determinate progress bar with an optional label.
 * @param {number} value  0..100
 * @param {string} [label]  shown above the bar with the percent on the right
 */
export default function ProgressBar({ value, label }) {
  const v = Math.max(0, Math.min(100, value || 0))
  return (
    <div>
      {label ? (
        <div className="mb-1 flex items-center justify-between text-xs text-zinc-500">
          <span>{label}</span>
          <span>{Math.round(v)}%</span>
        </div>
      ) : null}
      <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200">
        <div
          className="h-full rounded-full bg-indigo-600 transition-[width] duration-200"
          style={{ width: `${v}%` }}
        />
      </div>
    </div>
  )
}
