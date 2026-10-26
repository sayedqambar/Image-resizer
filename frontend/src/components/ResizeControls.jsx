/**
 * Resize controls: pixel / percentage mode, width & height inputs, quick
 * percentage buttons, and an aspect-ratio lock toggle.
 *
 * baseWidth/baseHeight are the dimensions of the current working image (after
 * any crop/rotate/flip), which the percentage mode scales relative to.
 *
 * State shape (owned by parent):
 *   { mode: 'pixels' | 'percentage', width, height, percentage, lockAspectRatio }
 */
export default function ResizeControls({
  baseWidth,
  baseHeight,
  settings,
  onChange,
}) {
  const aspect = baseWidth / baseHeight
  const isPercentage = settings.mode === 'percentage'

  const setMode = (mode) => {
    if (mode === 'percentage') {
      // seed percentage from the current width so the switch is non-destructive
      const pct = Math.max(1, Math.round((settings.width / baseWidth) * 100))
      onChange({ ...settings, mode, percentage: pct })
    } else {
      onChange({ ...settings, mode })
    }
  }

  const onWidthChange = (raw) => {
    const width = clampInt(raw, 1, 20000)
    const height = settings.lockAspectRatio
      ? Math.max(1, Math.round(width / aspect))
      : settings.height
    onChange({ ...settings, width, height })
  }

  const onHeightChange = (raw) => {
    const height = clampInt(raw, 1, 20000)
    const width = settings.lockAspectRatio
      ? Math.max(1, Math.round(height * aspect))
      : settings.width
    onChange({ ...settings, width, height })
  }

  const onPercentageChange = (raw) => {
    const percentage = clampInt(raw, 1, 400)
    const f = percentage / 100
    onChange({
      ...settings,
      mode: 'percentage',
      percentage,
      width: Math.max(1, Math.round(baseWidth * f)),
      height: Math.max(1, Math.round(baseHeight * f)),
    })
  }

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-zinc-700">Resize</h3>

      {/* Mode toggle (segmented control) */}
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
          <label htmlFor="percentage" className="mb-1 block text-xs font-medium text-zinc-500">
            Scale
          </label>
          <div className="flex items-center gap-2">
            <input
              id="percentage"
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

          <p className="mt-4 text-sm text-zinc-500">
            Result:{' '}
            <span className="font-medium text-zinc-700">
              {settings.width} × {settings.height}px
            </span>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="width" className="mb-1 block text-xs font-medium text-zinc-500">
              Width (px)
            </label>
            <input
              id="width"
              type="number"
              min={1}
              max={20000}
              value={settings.width}
              onChange={(e) => onWidthChange(e.target.value)}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label htmlFor="height" className="mb-1 block text-xs font-medium text-zinc-500">
              Height (px)
            </label>
            <input
              id="height"
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

      {/* Aspect ratio lock toggle */}
      <div className="mt-5 flex items-center justify-between">
        <label htmlFor="lock-aspect" className="text-sm font-medium text-zinc-700">
          Lock aspect ratio
        </label>
        <button
          id="lock-aspect"
          type="button"
          role="switch"
          aria-checked={settings.lockAspectRatio}
          disabled={isPercentage}
          onClick={() => onChange({ ...settings, lockAspectRatio: !settings.lockAspectRatio })}
          className={[
            'relative inline-flex h-6 w-11 items-center rounded-full transition',
            settings.lockAspectRatio ? 'bg-indigo-600' : 'bg-zinc-300',
            isPercentage ? 'opacity-50' : '',
          ].join(' ')}
        >
          <span
            className={[
              'inline-block h-4 w-4 transform rounded-full bg-white shadow transition',
              settings.lockAspectRatio ? 'translate-x-6' : 'translate-x-1',
            ].join(' ')}
          />
        </button>
      </div>
      {isPercentage && (
        <p className="mt-1 text-xs text-zinc-400">
          Aspect ratio is always preserved in percentage mode.
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

/** Clamp a numeric string to an integer within [min, max]; min for empty/invalid input. */
function clampInt(value, min, max) {
  const n = parseInt(value, 10)
  if (Number.isNaN(n)) return min
  return Math.min(max, Math.max(min, n))
}
