/**
 * Batch resize controls — applied identically to every image.
 *
 * - Percentage: scale each image by the same factor (each keeps its own aspect).
 * - Pixels: apply an exact width × height to every image (non-matching aspects
 *   will stretch; that's the "same settings to all" case).
 *
 * settings: { mode: 'percentage' | 'pixels', width, height, percentage }
 */
export default function BatchResizeControls({ settings, onChange }) {
  const isPercentage = settings.mode === 'percentage'

  const setMode = (mode) => onChange({ ...settings, mode })

  const onPercentageChange = (raw) => {
    const percentage = clampInt(raw, 1, 400)
    onChange({ ...settings, mode: 'percentage', percentage })
  }

  const onWidthChange = (raw) =>
    onChange({ ...settings, mode: 'pixels', width: clampInt(raw, 1, 20000), height: settings.height || 1 })

  const onHeightChange = (raw) =>
    onChange({ ...settings, mode: 'pixels', width: settings.width || 1, height: clampInt(raw, 1, 20000) })

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-zinc-700">Resize (all images)</h3>

      <div className="mb-5 inline-flex w-fit rounded-lg bg-zinc-100 p-1">
        <ModeButton active={!isPercentage} onClick={() => setMode('pixels')}>
          Pixels
        </ModeButton>
        <ModeButton active={isPercentage} onClick={() => setMode('percentage')}>
          Percentage
        </ModeButton>
      </div>

      {isPercentage ? (
        <div>
          <label htmlFor="batch-percentage" className="mb-1 block text-xs font-medium text-zinc-500">
            Scale
          </label>
          <div className="flex items-center gap-2">
            <input
              id="batch-percentage"
              type="number"
              min={1}
              max={400}
              value={settings.percentage}
              onChange={(e) => onPercentageChange(e.target.value)}
              className="w-28 rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
            <span className="text-sm text-zinc-500">%</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {[25, 50, 75, 100].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onPercentageChange(String(p))}
                className={[
                  'rounded-md px-3 py-1.5 text-xs font-medium transition',
                  settings.percentage === p
                    ? 'bg-indigo-600 text-white'
                    : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200',
                ].join(' ')}
              >
                {p}%
              </button>
            ))}
          </div>

          <p className="mt-3 text-xs text-zinc-400">Each image keeps its own aspect ratio.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="batch-width" className="mb-1 block text-xs font-medium text-zinc-500">
              Width (px)
            </label>
            <input
              id="batch-width"
              type="number"
              min={1}
              max={20000}
              value={settings.width}
              onChange={(e) => onWidthChange(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label htmlFor="batch-height" className="mb-1 block text-xs font-medium text-zinc-500">
              Height (px)
            </label>
            <input
              id="batch-height"
              type="number"
              min={1}
              max={20000}
              value={settings.height}
              onChange={(e) => onHeightChange(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
        </div>
      )}

      {!isPercentage && (
        <p className="mt-3 text-xs text-zinc-400">
          Exact size is applied to every image; non-matching aspects will stretch.
        </p>
      )}
    </div>
  )
}

function ModeButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'rounded-md px-4 py-1.5 text-sm font-medium transition',
        active ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

function clampInt(value, min, max) {
  const n = parseInt(value, 10)
  if (Number.isNaN(n)) return min
  return Math.min(max, Math.max(min, n))
}
