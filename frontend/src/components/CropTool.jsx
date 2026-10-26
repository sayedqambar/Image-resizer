import { useState } from 'react'
import Cropper from 'react-easy-crop'

/**
 * Full-screen crop modal built on react-easy-crop.
 * Offers aspect-ratio presets (Free, 1:1, 4:3, 3:4, 16:9, 9:16), a zoom slider,
 * and Apply / Cancel. On Apply, hands the cropped region (in source pixels) back
 * to the parent via onApply(croppedAreaPixels).
 */
const ASPECTS = [
  { label: 'Free', value: undefined },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '3:4', value: 3 / 4 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
]

export default function CropTool({ imageSrc, onApply, onCancel }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [aspect, setAspect] = useState(undefined)
  const [croppedPixels, setCroppedPixels] = useState(null)

  const handleAspect = (value) => {
    setAspect(value)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/90 p-4">
      <div className="mb-4 flex items-center justify-between text-white">
        <h2 className="text-base font-semibold">Crop image</h2>
      </div>

      <div className="relative mb-4 h-[60vh] w-full overflow-hidden rounded-xl bg-zinc-900">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(_area, pixels) => setCroppedPixels(pixels)}
        />
      </div>

      <div className="mx-auto w-full max-w-2xl space-y-4">
        <div className="flex flex-wrap gap-2">
          {ASPECTS.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => handleAspect(a.value)}
              className={[
                'rounded-md px-3 py-1.5 text-xs font-medium transition',
                aspect === a.value
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white/10 text-white hover:bg-white/20',
              ].join(' ')}
            >
              {a.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-white">
          <span className="text-xs">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-indigo-500"
          />
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!croppedPixels}
            onClick={() => croppedPixels && onApply(croppedPixels)}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-50"
          >
            Apply crop
          </button>
        </div>
      </div>
    </div>
  )
}
