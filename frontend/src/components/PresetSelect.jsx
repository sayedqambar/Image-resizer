/**
 * Dropdown of common preset sizes. Selecting one fills the resize width/height
 * (in pixel mode, with aspect lock off so the exact target is honored).
 */
const PRESETS = [
  { label: 'Instagram post', width: 1080, height: 1080 },
  { label: 'YouTube thumbnail', width: 1280, height: 720 },
  { label: 'LinkedIn banner', width: 1584, height: 396 },
  { label: 'WhatsApp DP', width: 500, height: 500 },
  { label: 'Passport photo', width: 413, height: 531 },
]

export default function PresetSelect({ onSelect }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <label htmlFor="preset-select" className="mb-2 block text-sm font-semibold text-zinc-700">
        Preset sizes
      </label>
      <select
        id="preset-select"
        value=""
        onChange={(e) => {
          const preset = PRESETS.find((p) => p.label === e.target.value)
          if (preset) onSelect(preset)
        }}
        className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      >
        <option value="" disabled>
          Choose a preset…
        </option>
        {PRESETS.map((p) => (
          <option key={p.label} value={p.label}>
            {p.label} — {p.width}×{p.height}
          </option>
        ))}
      </select>
    </div>
  )
}
