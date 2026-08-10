import type { ReactNode } from 'react'
import type { WeatherCurrent } from '../../types'
import { WeatherWidget } from '../WeatherWidget'
import { Clock } from '../Clock'
import type { SidebarState } from '../../hooks/useSidebar'
import { colors, spacing, radii, typography, layout } from '../../theme/tokens'
import { formatHeaderDate } from '../../utils/dateFormat'

interface HeaderProps {
  weather: WeatherCurrent
  sidebarState: SidebarState
  onOpenSidebar: () => void
  /** Right-side controls (ViewSwitcher, Today button, date display, etc.). */
  children?: ReactNode
  /** Date to display in the header. Defaults to today. */
  currentDate?: Date
  /** Screen orientation — portrait stacks the controls on a second row. */
  orientation?: 'landscape' | 'portrait'
}

export function Header({
  weather,
  sidebarState,
  onOpenSidebar,
  children,
  currentDate = new Date(),
  orientation = 'landscape',
}: HeaderProps) {
  const dateStr = formatHeaderDate(currentDate)
  const isPortrait = orientation === 'portrait'

  return (
    <header
      style={{
        background: colors.white,
        borderBottom: `1px solid ${colors.border}`,
        padding: `${spacing.md}px ${spacing.xl}px`,
        display: 'flex',
        flexDirection: isPortrait ? 'column' : 'row',
        alignItems: isPortrait ? 'stretch' : 'center',
        justifyContent: 'space-between',
        gap: isPortrait ? `${spacing.sm}px` : 0,
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: `${spacing.md}px` }}>
        {sidebarState === 'hidden' && (
          <button
            onClick={onOpenSidebar}
            style={{
              width: `${layout.logoSize}px`,
              height: `${layout.logoSize}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: `${radii.lg}px`,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            title="Open sidebar"
          >
            <svg
              style={{ width: '20px', height: '20px', color: colors.textMuted }}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        )}
        <div
          style={{
            width: `${layout.logoSize}px`,
            height: `${layout.logoSize}px`,
            background: colors.primary,
            borderRadius: `${radii.lg}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: colors.white,
            fontWeight: 700,
            fontSize: '18px',
          }}
        >
          D
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: `${spacing.md}px` }}>
          <h1
            style={{
              fontSize: '16px',
              fontWeight: typography.headerTitle.weight,
              color: colors.textPrimary,
              margin: 0,
              whiteSpace: 'nowrap',
            }}
          >
            {dateStr}
          </h1>
          <Clock />
          <WeatherWidget weather={weather} />
        </div>
      </div>
      {children && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: `${spacing.sm}px`,
            ...(isPortrait ? { flexWrap: 'wrap', justifyContent: 'space-between' } : undefined),
          }}
        >
          {children}
        </div>
      )}
    </header>
  )
}
