/**
 * Rotate (90° steps) and flip (horizontal / vertical) buttons, plus a button that
 * opens the crop tool. Each geometric op is applied relative to the current
 * working image (handled in App).
 */
export default function TransformButtons({ onRotate, onFlip, onCrop }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <h3 className="mb-4 text-sm font-semibold text-zinc-700">Adjust</h3>

      <div className="grid grid-cols-2 gap-2">
        <ToolButton onClick={() => onRotate('left')} label="Rotate left">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </ToolButton>

        <ToolButton onClick={() => onRotate('right')} label="Rotate right">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
          </svg>
        </ToolButton>

        <ToolButton onClick={() => onFlip('h')} label="Flip H">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <line x1="12" y1="3" x2="12" y2="21" />
            <polyline points="8 7 4 12 8 17" />
            <polyline points="16 7 20 12 16 17" />
          </svg>
        </ToolButton>

        <ToolButton onClick={() => onFlip('v')} label="Flip V">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
            <line x1="3" y1="12" x2="21" y2="12" />
            <polyline points="7 8 12 4 17 8" />
            <polyline points="7 16 12 20 17 16" />
          </svg>
        </ToolButton>
      </div>

      <button
        type="button"
        onClick={onCrop}
        className="mt-3 w-full rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
      >
        Crop
      </button>
    </div>
  )
}

function ToolButton({ onClick, label, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:border-indigo-300 hover:bg-indigo-50"
    >
      {children}
      <span>{label}</span>
    </button>
  )
}
