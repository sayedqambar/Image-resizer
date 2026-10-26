/**
 * Output format selector (JPG / PNG / WebP) and a quality slider for lossy formats.
 * PNG is lossless, so the quality slider is hidden (and noted) when PNG is selected.
 */
const FORMATS = [
  { value: 'image/jpeg', label: 'JPG' },
  { value: 'image/png', label: 'PNG' },
  { value: 'image/webp', label: 'WebP' },
]

export default function FormatOptions({ format, onFormatChange, quality, onQualityChange }) {
  const lossless = format === 'image/png'

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-zinc-700">Export format</h3>

      <div className="flex gap-2">
        {FORMATS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => onFormatChange(f.value)}
            className={[
              'flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition',
              format === f.value
                ? 'bg-indigo-600 text-white'
                : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="mt-4">
        {lossless ? (
          <p className="text-xs text-zinc-400">PNG is lossless — quality doesn&apos;t apply.</p>
        ) : (
          <>
            <div className="mb-1 flex items-center justify-between">
              <label htmlFor="quality" className="text-xs font-medium text-zinc-500">
                Quality
              </label>
              <span className="text-xs text-zinc-500">{Math.round(quality * 100)}%</span>
            </div>
            <input
              id="quality"
              type="range"
              min={0.1}
              max={1}
              step={0.01}
              value={quality}
              onChange={(e) => onQualityChange(Number(e.target.value))}
              className="w-full accent-indigo-600"
            />
          </>
        )}
      </div>
    </div>
  )
}
