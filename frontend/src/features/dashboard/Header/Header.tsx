import type { ReactNode } from 'react'
import type { WeatherCurrent } from '@/types'
import { WeatherWidget } from '@/features/weather/components/WeatherWidget'
import { Clock } from '@/features/dashboard/Clock'
import { colors, spacing, typography } from '@/theme/tokens'
import { formatHeaderDate } from '@/shared/utils/dateFormat'

interface HeaderProps {
  weather: WeatherCurrent
  /** Right-side controls (ViewSwitcher, Today button, date display, etc.). */
  children?: ReactNode
  /** Date to display in the header. Defaults to today. */
  currentDate?: Date
  /** Progressive visibility tiers — driven by viewport width (App.tsx). */
  showDate?: boolean
  showClock?: boolean
  showWeather?: boolean
}

export function Header({
  weather,
  children,
  currentDate = new Date(),
  showDate = true,
  showClock = true,
  showWeather = true,
}: HeaderProps) {
  const dateStr = formatHeaderDate(currentDate)

  return (
    <header
      style={{
        background: colors.white,
        borderBottom: `1px solid ${colors.border}`,
        padding: `${spacing.md}px ${spacing.xl}px`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        gap: `${spacing.sm}px`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: `${spacing.md}px` }}>
        {showDate && (
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
        )}
        {showClock && <Clock />}
        {showWeather && <WeatherWidget weather={weather} />}
      </div>
      {children && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: `${spacing.sm}px`,
            flexWrap: 'nowrap',
            minWidth: 0,
          }}
        >
          {children}
        </div>
      )}
    </header>
  )
}
