import { useEffect, useState } from 'react'

interface StatusBarProps {
  calendarLastRefresh: number | null
  weatherLastRefresh: number | null
  onRefreshCalendar: () => void
  onRefreshWeather: () => void
  onRefreshAll: () => void
}

const CALENDAR_INTERVAL = 120 // 2 minutes in seconds
const WEATHER_INTERVAL = 600 // 10 minutes in seconds

export function StatusBar({
  calendarLastRefresh,
  weatherLastRefresh,
  onRefreshCalendar,
  onRefreshWeather,
  onRefreshAll,
}: StatusBarProps) {
  const [visible, setVisible] = useState(true)
  const [now, setNow] = useState(0)

  // Initialize and tick every second to update countdowns
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
    <>
      <div
        className={`flex-shrink-0 h-7 bg-gray-50 border-t border-gray-200 flex items-center px-4 text-xs text-gray-400 transition-all duration-250 overflow-hidden ${
          visible ? 'h-7 opacity-100' : 'h-0 opacity-0 border-t-transparent'
        }`}
      >
        {/* Refresh All button - left aligned */}
        <button
          onClick={onRefreshAll}
          className="p-1.5 border border-gray-300 bg-white rounded hover:bg-gray-100 transition-colors"
          aria-label="Refresh all"
          title="Refresh all data"
        >
          <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
        </button>

        {/* Status items - centered */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3">
            {/* Calendar indicator */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onRefreshCalendar}
                className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                aria-label="Refresh calendar"
                title="Refresh calendar"
              >
                <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  calendarRefreshing ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'
                }`}
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

            {/* Beveled divider */}
            <div className="w-px h-4 bg-gradient-to-b from-transparent via-gray-300 to-transparent" />

            {/* Weather indicator */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={onRefreshWeather}
                className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                aria-label="Refresh weather"
                title="Refresh weather"
              >
                <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </button>
              <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  weatherRefreshing ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'
                }`}
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
      </div>
      <button
        onClick={() => setVisible(!visible)}
        className="fixed bottom-1 right-2 z-30 w-5 h-5 rounded flex items-center justify-center text-gray-300 hover:text-gray-500 hover:bg-black/5 transition-colors"
        title="Toggle status bar"
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-3.5 h-3.5">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        </svg>
      </button>
    </>
  )
}
