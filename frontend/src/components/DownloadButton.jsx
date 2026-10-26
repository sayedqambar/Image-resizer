import { extensionFor } from '../utils/canvasResize'

/**
 * Download link for the resized image. Disabled until a result is ready or while
 * processing is in progress.
 */
export default function DownloadButton({ result, originalName, isProcessing }) {
  const disabled = !result || isProcessing

  const baseName = originalName ? originalName.replace(/\.[^.]+$/, '') : 'image'
  const ext = result ? extensionFor(result.blob.type) : 'png'
  const filename = `${baseName}_${result?.width ?? 0}x${result?.height ?? 0}.${ext}`

  return (
    <a
      href={disabled ? undefined : result.url}
      download={disabled ? undefined : filename}
      aria-disabled={disabled}
      onClick={(e) => disabled && e.preventDefault()}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition',
        disabled
          ? 'cursor-not-allowed bg-zinc-200 text-zinc-400'
          : 'bg-indigo-600 text-white shadow-sm hover:bg-indigo-700',
      ].join(' ')}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 18h16" />
      </svg>
      {isProcessing ? 'Processing…' : 'Download resized image'}
    </a>
  )
}
