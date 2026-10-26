import { useAuth } from '../hooks/useAuth'

/**
 * Shows remaining daily AI uses as a small progress bar + label.
 * Placed in the app header so it's always visible.
 *
 * @param {() => void} [onLoginClick]  called when the guest clicks the nudge
 */
export default function UsageBar({ onLoginClick }) {
  const { usage, email } = useAuth()
  if (!usage) return null

  const { dailyLimit, remaining, authenticated } = usage
  const pct   = dailyLimit > 0 ? (remaining / dailyLimit) * 100 : 0
  const color = remaining === 0
    ? 'bg-red-500'
    : remaining <= 1
      ? 'bg-amber-400'
      : 'bg-emerald-500'

  return (
    <div className="flex items-center gap-2.5">
      {/* Text label */}
      <div className="hidden sm:flex flex-col items-end leading-tight">
        <span className="text-xs font-medium text-zinc-600">
          {authenticated ? email : 'Guest'}
        </span>
        <span className="text-xs text-zinc-400">
          {remaining}/{dailyLimit} AI uses today
        </span>
      </div>

      {/* Bar */}
      <div
        className="w-20 h-2 rounded-full bg-zinc-200 overflow-hidden cursor-default"
        title={`${remaining} of ${dailyLimit} AI uses remaining today`}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Guest nudge */}
      {!authenticated && remaining === 0 && onLoginClick && (
        <button
          type="button"
          onClick={onLoginClick}
          className="text-xs font-medium text-indigo-600 hover:underline"
        >
          Log in
        </button>
      )}
    </div>
  )
}
