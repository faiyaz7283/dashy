/**
 * Status bar component — bottom bar with settings, refresh countdowns, and theme toggle.
 *
 * Displays:
 * - LEFT: Settings icon
 * - CENTER: Calendar and weather refresh countdown timers
 * - RIGHT: Theme toggle (light/dark/auto cycle)
 *
 * The status bar is positioned absolutely on the bottom edge and overlays the content area.
 * Auto-hide behavior is managed by the parent AppShell via useAutoHide.
 */

import { Settings, Clock, Cloud } from 'lucide-react'
import { Sun, Moon, Monitor } from 'lucide-react'
import type { ThemeMode } from '@/shared/hooks/useTheme'
import { layout } from '@/theme/tokens'

/** Props for the StatusBar component. */
export interface StatusBarProps {
  /** Current theme mode. */
  themeMode: ThemeMode
  /** Callback to cycle the theme. */
  onThemeCycle: () => void
}

/**
 * Status bar with settings, refresh countdowns, and theme toggle.
 *
 * @param props - Status bar configuration and callbacks.
 * @returns The status bar UI.
 */
export function StatusBar({ themeMode, onThemeCycle }: StatusBarProps) {
  return (
    <footer
      className="absolute bottom-0 left-0 right-0 z-50 border-t border-border bg-white shadow-sm"
      style={{ height: layout.statusBarHeight }}
    >
      <div className="flex h-full items-center justify-between px-4 py-2">
        {/* Left: Settings */}
        <button
          className="rounded-md p-2 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
          title="Settings"
        >
          <Settings className="h-5 w-5" />
        </button>

        {/* Center: Calendar + Weather Countdowns */}
        <div className="flex items-center gap-4 text-sm text-text-muted">
          {/* Calendar refresh countdown */}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>2:34</span>
          </div>

          {/* Weather refresh countdown */}
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4" />
            <span>14:22</span>
          </div>
        </div>

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
