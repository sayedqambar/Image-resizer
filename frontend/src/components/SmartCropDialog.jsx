import { useState } from 'react'

/**
 * Small modal that collects width and height ratio values before sending the
 * smart-crop request. Values default to 1:1.
 */
const RATIO_PRESETS = [
  { label: '1:1', w: 1, h: 1 },
  { label: '4:3', w: 4, h: 3 },
  { label: '3:4', w: 3, h: 4 },
  { label: '16:9', w: 16, h: 9 },
  { label: '9:16', w: 9, h: 16 },
]

export default function SmartCropDialog({ onConfirm, onCancel }) {
  const [w, setW] = useState(1)
  const [h, setH] = useState(1)

  const apply = (preset) => { setW(preset.w); setH(preset.h) }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-base font-semibold text-zinc-800">Smart Crop — aspect ratio</h2>

        <div className="mb-4 flex flex-wrap gap-2">
          {RATIO_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => apply(p)}
              className={[
                'rounded-md px-3 py-1.5 text-xs font-medium transition',
                w === p.w && h === p.h
                  ? 'bg-indigo-600 text-white'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200',
              ].join(' ')}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Width ratio</label>
            <input
              type="number"
              min={1}
              value={w}
              onChange={(e) => setW(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Height ratio</label>
            <input
              type="number"
              min={1}
              value={h}
              onChange={(e) => setH(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(w, h)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Crop
          </button>
        </div>
      </div>
    </div>
  )
}
