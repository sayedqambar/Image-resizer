import { useCallback, useRef, useState } from 'react'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ACCEPTED_ATTR = '.jpg,.jpeg,.png,.webp'
const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

/**
 * Drag-and-drop + click-to-upload area. Supports single or multiple files.
 * Validates type (JPG/PNG/WebP) and size (<= 10MB each) before handing the valid
 * files up via onFiles(files[]).
 *
 * @param {boolean} multiple  allow selecting/dropping more than one file
 * @param {(files: File[]) => void} onFiles  receives only the valid files
 */
export default function ImageDropzone({ multiple = false, onFiles }) {
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  const handleFiles = useCallback(
    (fileList) => {
      const files = Array.from(fileList || [])
      if (!files.length) return

      const valid = []
      let unsupported = 0
      let tooLarge = 0
      files.forEach((f) => {
        if (!ACCEPTED_TYPES.includes(f.type)) unsupported += 1
        else if (f.size > MAX_SIZE) tooLarge += 1
        else valid.push(f)
      })

      if (unsupported || tooLarge) {
        if (files.length === 1) {
          setError(
            unsupported
              ? 'Unsupported format. Please use JPG, PNG, or WebP.'
              : 'That file is over 10 MB. Please choose a smaller image.',
          )
        } else {
          const reasons = []
          if (unsupported) reasons.push(`${unsupported} unsupported`)
          if (tooLarge) reasons.push(`${tooLarge} over 10 MB`)
          setError(`Skipped ${unsupported + tooLarge} of ${files.length} (${reasons.join(', ')}).`)
        }
      } else {
        setError('')
      }

      if (valid.length) onFiles(valid)
    },
    [onFiles],
  )

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={multiple ? 'Upload images' : 'Upload an image'}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setIsDragging(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        setIsDragging(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      className={[
        'group relative flex min-h-[300px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-200',
        isDragging
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-zinc-300 bg-zinc-50 hover:border-indigo-400 hover:bg-indigo-50/50',
      ].join(' ')}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_ATTR}
        multiple={multiple}
        className="sr-only"
        onChange={(e) => {
          handleFiles(e.target.files)
          // reset so choosing the same file(s) again still fires onChange
          e.target.value = ''
        }}
      />

      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 transition group-hover:scale-105">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-7 w-7"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.8}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0L8 8m4-4l4 4" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
        </svg>
      </div>

      <p className="text-base font-medium text-zinc-800">
        {multiple ? 'Drop images here, or ' : 'Drop an image here, or '}
        <span className="text-indigo-600 underline decoration-indigo-300 underline-offset-2">
          browse
        </span>
      </p>
      <p className="mt-1 text-sm text-zinc-500">
        JPG, PNG, or WebP — up to 10 MB{multiple ? ' each' : ''}
      </p>

      {error && (
        <p className="mt-4 text-sm font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}
