/**
 * StatusBar component showing countdown timers for calendar and weather refreshes.
 *
 * Visibility is driven by the parent (mouse proximity to the bottom edge,
 * macOS-Dock style) via the `visible` prop.
 */

import { useEffect, useState } from 'react'

interface StatusBarProps {
  calendarLastRefresh: number | null
  weatherLastRefresh: number | null
  /** Whether the bar is visible (mouse near the bottom edge). */
  visible?: boolean
}

const CALENDAR_INTERVAL = 120 // 2 minutes in seconds
const WEATHER_INTERVAL = 600 // 10 minutes in seconds

/**
 * StatusBar component.
 *
 * @param props - Component props.
 * @returns The status bar UI.
 */
export function StatusBar({
  calendarLastRefresh,
  weatherLastRefresh,
  visible = true,
}: StatusBarProps) {
  const [now, setNow] = useState(0)

  useEffect(() => {
    setNow(Date.now())
    const interval = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(interval)
  }, [])

  function formatCountdown(seconds: number): string {
    if (seconds <= 0) return 'refreshing…'
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    if (m > 0) return `in ${m}m ${String(s).padStart(2, '0')}s`
    return `in ${s}s`
  }

  function getCountdown(lastRefresh: number | null, interval: number): number {
    if (!lastRefresh) return interval
    const elapsed = Math.floor((now - lastRefresh) / 1000)
    return Math.max(0, interval - elapsed)
  }

  const calendarCountdown = getCountdown(calendarLastRefresh, CALENDAR_INTERVAL)
  const weatherCountdown = getCountdown(weatherLastRefresh, WEATHER_INTERVAL)
  const calendarRefreshing = calendarCountdown === 0
  const weatherRefreshing = weatherCountdown === 0

  return (
    <div
      className={`flex-shrink-0 flex items-center justify-center px-4 transition-all duration-250 overflow-hidden ${
        visible ? 'h-7 opacity-100' : 'h-0 opacity-0'
      }`}
      style={{
        background: 'var(--dt-bg)',
        borderTop: visible ? '1px solid var(--dt-border)' : '1px solid transparent',
        fontSize: '12px',
        color: 'var(--dt-text-faint)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Calendar indicator */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${calendarRefreshing ? 'animate-pulse' : ''}`}
            style={{ background: calendarRefreshing ? 'var(--dt-primary)' : 'var(--dt-success)' }}
          />
          <svg
            className="w-3.5 h-3.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <span className="inline-block min-w-[72px] text-left tabular-nums">
            {formatCountdown(calendarCountdown)}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-4 bg-gradient-to-b from-transparent via-gray-300 to-transparent" />

        {/* Weather indicator */}
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${weatherRefreshing ? 'animate-pulse' : ''}`}
            style={{ background: weatherRefreshing ? 'var(--dt-primary)' : 'var(--dt-success)' }}
          />
          <svg
            className="w-3.5 h-3.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <span className="inline-block min-w-[72px] text-left tabular-nums">
            {formatCountdown(weatherCountdown)}
          </span>
        </div>
      </div>
    </div>
  )
}
