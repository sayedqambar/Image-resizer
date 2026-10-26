import { useState } from 'react'
import { useAiTool } from '../hooks/useAiTool'
import { useAuth } from '../hooks/useAuth'
import { aiApi } from '../services/aiApi'
import BeforeAfterSlider from './BeforeAfterSlider'
import SmartCropDialog from './SmartCropDialog'

/**
 * AI Tools panel for the single-image editor.
 *
 * Props:
 *   sourceFile  – the File object to send (the current working image file)
 *   sourceUrl   – preview URL for the before-side of the slider
 *   onUseResult – called with { blob, url } when the user clicks "Use as source"
 *   onLoginNeeded – called when a 429 is received for a guest so App can open AuthPage
 */
export default function AiToolsPanel({ sourceFile, sourceUrl, onUseResult, onLoginNeeded }) {
  const { token, usage, refreshUsage } = useAuth()
  const tool = useAiTool()
  const [activeTool, setActiveTool]   = useState(null)
  const [cropDialogOpen, setCropDialogOpen] = useState(false)

  const run = (toolKey, apiFn) => {
    setActiveTool(toolKey)
    tool.run(async () => {
      try {
        const result = await apiFn()
        await refreshUsage(token)
        return result
      } catch (err) {
        await refreshUsage(token)
        throw err
      }
    })
  }

  const handleRemoveBg    = () => run('removeBg', () => aiApi.removeBackground(sourceFile, token))
  const handleUpscale2    = () => run('upscale2', () => aiApi.upscale(sourceFile, 2, token))
  const handleUpscale4    = () => run('upscale4', () => aiApi.upscale(sourceFile, 4, token))
  const handleSmartCropConfirm = (w, h) => {
    setCropDialogOpen(false)
    run('smartCrop', () => aiApi.smartCrop(sourceFile, w, h, token))
  }

  const handleUseAsSource = () => {
    if (tool.result) onUseResult(tool.result)
    tool.reset(); setActiveTool(null)
  }
  const handleDismiss = () => { tool.reset(); setActiveTool(null) }

  const isLoading     = tool.status === 'loading'
  const quotaExceeded = tool.status === 'error' && tool.error?.includes('Daily limit')
  const noUses        = usage?.remaining === 0

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <h3 className="mb-1 text-sm font-semibold text-zinc-700">AI Tools</h3>
      <p className="mb-4 text-xs text-zinc-400">
        Processed server-side — requires the backend to be running.
      </p>

      {/* Usage nudge */}
      {noUses && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
          <p className="text-sm text-amber-700">
            {usage.authenticated
              ? `Daily limit reached (${usage.dailyLimit}/day). Resets at midnight UTC.`
              : `Guest limit reached (${usage.dailyLimit}/day). Log in for ${usage.dailyLimit + 3} uses/day.`}
          </p>
          {!usage.authenticated && onLoginNeeded && (
            <button
              type="button"
              onClick={onLoginNeeded}
              className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Log in
            </button>
          )}
        </div>
      )}

      {/* Tool buttons */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <AiButton label="Remove BG"  toolKey="removeBg"  activeTool={activeTool} isLoading={isLoading} disabled={noUses} icon={<BgIcon />}     onClick={handleRemoveBg} />
        <AiButton label="Upscale 2×" toolKey="upscale2"  activeTool={activeTool} isLoading={isLoading} disabled={noUses} icon={<UpscaleIcon />} onClick={handleUpscale2} />
        <AiButton label="Upscale 4×" toolKey="upscale4"  activeTool={activeTool} isLoading={isLoading} disabled={noUses} icon={<UpscaleIcon />} onClick={handleUpscale4} />
        <AiButton label="Smart Crop" toolKey="smartCrop" activeTool={activeTool} isLoading={isLoading} disabled={noUses} icon={<CropIcon />}    onClick={() => setCropDialogOpen(true)} />
      </div>

      {/* Error banner */}
      {tool.status === 'error' && (
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3">
          <svg className="mt-0.5 h-4 w-4 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-red-700">AI request failed</p>
            <p className="mt-0.5 text-xs text-red-600">{tool.error}</p>
            {quotaExceeded && !usage?.authenticated && onLoginNeeded && (
              <button
                type="button"
                onClick={onLoginNeeded}
                className="mt-2 rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
              >
                Log in for more uses
              </button>
            )}
          </div>
          <button type="button" onClick={handleDismiss} className="shrink-0 text-red-400 hover:text-red-600" aria-label="Dismiss">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}

      {/* Result: before/after slider + actions */}
      {tool.status === 'success' && tool.result && (
        <div className="mt-5">
          <BeforeAfterSlider
            beforeSrc={sourceUrl}
            afterSrc={tool.result.url}
            beforeLabel="Original"
            afterLabel={toolLabel(activeTool)}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleUseAsSource}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
              Use as source
            </button>
            <a
              href={tool.result.url}
              download={`ai-${activeTool ?? 'result'}.png`}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 18h16" />
              </svg>
              Download
            </a>
            <button type="button" onClick={handleDismiss} className="text-sm text-zinc-400 hover:text-zinc-600">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {cropDialogOpen && (
        <SmartCropDialog onConfirm={handleSmartCropConfirm} onCancel={() => setCropDialogOpen(false)} />
      )}
    </div>
  )
}

function toolLabel(key) {
  return { removeBg: 'No BG', upscale2: 'Upscaled 2×', upscale4: 'Upscaled 4×', smartCrop: 'Smart Crop' }[key] ?? 'Result'
}

function AiButton({ label, toolKey, activeTool, isLoading, disabled, icon, onClick }) {
  const isMine = activeTool === toolKey
  const busy   = isLoading && isMine
  return (
    <button
      type="button"
      disabled={isLoading || disabled}
      onClick={onClick}
      className={[
        'flex flex-col items-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-medium transition',
        busy   ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
               : (isLoading || disabled)
                 ? 'cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-400'
                 : 'border-zinc-200 bg-zinc-50 text-zinc-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700',
      ].join(' ')}
    >
      <span className="relative flex h-6 w-6 items-center justify-center">
        {busy ? <Spinner /> : icon}
      </span>
      <span>{label}</span>
    </button>
  )
}

function Spinner() {
  return (
    <svg className="h-5 w-5 animate-spin text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  )
}
function BgIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" strokeDasharray="4 2" /><circle cx="12" cy="11" r="3" /><path d="M6 20c0-3 2.686-5 6-5s6 2 6 5" /></svg>
}
function UpscaleIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><polyline points="15 3 21 3 21 9" /><path d="M21 3l-7 7" /><polyline points="9 21 3 21 3 15" /><path d="M3 21l7-7" /></svg>
}
function CropIcon() {
  return <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M6 2v14a2 2 0 002 2h14" /><path d="M18 22V8a2 2 0 00-2-2H2" /></svg>
}
