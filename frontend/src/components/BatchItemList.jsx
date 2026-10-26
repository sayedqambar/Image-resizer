import { formatBytes } from '../utils/canvasResize'

/**
 * List of batch items with original + resized thumbnails and sizes, plus a
 * per-item remove button.
 *
 * @param {Array} items    [{ id, file, originalUrl, width, height, size }]
 * @param {Object} results { [id]: { url, width, height, size } }
 * @param {(id: number) => void} onRemove
 */
export default function BatchItemList({ items, results, onRemove }) {
  if (!items.length) return null
  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const res = results[item.id]
        return (
          <li
            key={item.id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <img
                src={item.originalUrl}
                alt={item.file.name}
                className="h-14 w-14 shrink-0 rounded bg-zinc-100 object-contain"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-zinc-800">{item.file.name}</p>
                <p className="text-xs text-zinc-500">
                  {item.width}×{item.height} · {formatBytes(item.size)}
                </p>
              </div>
            </div>

            <span className="text-zinc-300" aria-hidden="true">→</span>

            <div className="flex min-w-0 flex-1 items-center gap-3">
              {res ? (
                <>
                  <img
                    src={res.url}
                    alt="resized"
                    className="h-14 w-14 shrink-0 rounded bg-zinc-100 object-contain"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-800">
                      {res.width}×{res.height}
                    </p>
                    <p className="text-xs text-zinc-500">{formatBytes(res.size)}</p>
                  </div>
                </>
              ) : (
                <div className="h-14 w-14 shrink-0 rounded bg-zinc-100" />
              )}
            </div>

            <button
              type="button"
              onClick={() => onRemove(item.id)}
              aria-label={`Remove ${item.file.name}`}
              className="ml-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </svg>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
