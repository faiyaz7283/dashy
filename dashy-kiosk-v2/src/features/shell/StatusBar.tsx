/**
 * Status bar component — bottom bar with settings, refresh countdowns, and theme toggle.
 *
 * Displays:
 * - LEFT: Settings icon
 * - CENTER: Calendar and weather refresh countdown timers (live, derived from lastRefresh)
 * - RIGHT: Theme toggle (light/dark/auto cycle)
 *
 * The status bar is positioned absolutely on the bottom edge and overlays the content area.
 * Auto-hide behavior is managed by the parent AppShell via useAutoHide.
 */

import { useState, useEffect } from 'react'
import { Settings, Clock, Cloud } from 'lucide-react'
import { Sun, Moon, Monitor } from 'lucide-react'
import { ENDPOINTS } from '@/shared/api/endpoints'
import type { ThemeMode } from '@/shared/hooks/useTheme'
import type { Feature } from './Sidebar'

/** Props for the StatusBar component. */
export interface StatusBarProps {
  /** The currently active feature (calendar or chores). */
  activeFeature: Feature
  /** Current theme mode. */
  themeMode: ThemeMode
  /** Callback to cycle the theme. */
  onThemeCycle: () => void
  /** Timestamp (ms) of the last successful calendar data refresh. */
  calendarLastRefresh: number | null
  /** Timestamp (ms) of the last successful weather data refresh. */
  weatherLastRefresh: number | null
}

/**
 * Status bar with settings, refresh countdowns, and theme toggle.
 *
 * @param props - Status bar configuration and callbacks.
 * @returns The status bar UI.
 */
export function StatusBar({ activeFeature, themeMode, onThemeCycle, calendarLastRefresh, weatherLastRefresh }: StatusBarProps) {
  const calendarCountdown = useRefreshCountdown(calendarLastRefresh, ENDPOINTS.calendar.refreshInterval)
  const weatherCountdown = useRefreshCountdown(weatherLastRefresh, ENDPOINTS.weather.refreshInterval)

  return (
    <footer
      className="absolute bottom-0 left-0 right-0 z-50 border-t border-border bg-white shadow-sm"
      style={{ height: 'var(--shell-status-bar-height)' }}
    >
      <div className="flex h-full items-center justify-between px-4 py-2">
        {/* Left: Settings */}
        <button
          className="rounded-md p-2 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>

        {/* Center: Calendar Feature Only — Calendar + Weather Countdowns */}
        {activeFeature === 'calendar' && (
          <div className="flex items-center gap-4 text-sm text-text-muted">
            {/* Calendar refresh countdown */}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{calendarCountdown}</span>
            </div>

            {/* Weather refresh countdown */}
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              <span>{weatherCountdown}</span>
            </div>
          </div>
        )}

        {/* Center: Chores Feature — Empty (no countdowns) */}
        {activeFeature === 'chores' && <div />}

        {/* Right: Theme Toggle */}
        <button
          onClick={onThemeCycle}
          className="rounded-md p-2 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
          title={`Theme: ${themeMode}`}
        >
          <ThemeIcon mode={themeMode} />
        </button>
      </div>
    </footer>
  )
}

/**
 * Computes a live countdown string from the last refresh timestamp.
 *
 * Updates every second. Shows "—" until the first refresh completes,
 * then shows "M:SS" or "SS" remaining until the next expected refresh.
 *
 * @param lastRefresh - Timestamp (ms) of the last successful fetch, or null.
 * @param intervalMs - The refresh interval in milliseconds.
 * @returns Formatted countdown string (e.g., "1:45", "0:30", "—").
 */
function useRefreshCountdown(lastRefresh: number | null, intervalMs: number): string {
  const [countdown, setCountdown] = useState('—')

  useEffect(() => {
    if (lastRefresh === null || intervalMs <= 0) {
      setCountdown('—')
      return
    }

    function updateCountdown() {
      const elapsed = Date.now() - (lastRefresh ?? 0)
      const remaining = Math.max(0, intervalMs - elapsed)
      const totalSeconds = Math.ceil(remaining / 1000)
      const minutes = Math.floor(totalSeconds / 60)
      const seconds = totalSeconds % 60
      setCountdown(
        minutes > 0 ? `${minutes}:${String(seconds).padStart(2, '0')}` : `${seconds}`,
      )
    }

    updateCountdown()
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [lastRefresh, intervalMs])

  return countdown
}

/** Props for the theme icon. */
interface ThemeIconProps {
  /** The current theme mode. */
  mode: ThemeMode
}

/**
 * Renders the appropriate icon for the current theme mode.
 *
 * - light: Sun
 * - dark: Moon
 * - auto: Monitor (system preference)
 */
function ThemeIcon({ mode }: ThemeIconProps) {
  switch (mode) {
    case 'light':
      return <Sun className="h-5 w-5" />
    case 'dark':
      return <Moon className="h-5 w-5" />
    case 'auto':
      return <Monitor className="h-5 w-5" />
  }
}
