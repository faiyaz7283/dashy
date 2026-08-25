/**
 * Shared weather badge component for calendar day cells.
 *
 * Displays weather icon + high/low temperatures in a compact format.
 * Shows weather popup on hover with mouse-tracked positioning.
 * Used in WeekView day cards, MonthView day cells, and DayView weather bar.
 */

import { WeatherIcon } from '@/features/weather/components/WeatherIcon'
import { WeatherPopup } from '@/features/weather/components/WeatherPopup'
import { useWeatherPopup } from '@/features/weather/hooks/useWeatherPopup'
import type { DailyForecast, WeatherCondition } from '@/types/weather'

/** Props for the DayWeatherBadge component. */
export interface DayWeatherBadgeProps {
  /** Weather forecast data for the day. */
  forecast: DailyForecast
  /** Whether this is today (affects icon color). */
  isToday?: boolean
  /** Date label for popup (e.g., "Today", "Tomorrow", "Wed"). */
  dateLabel: string
  /** Date sublabel for popup (e.g., "Aug 20"). */
  dateSublabel: string
  /** Icon size variant. */
  iconSize?: 'sm' | 'md' | 'lg'
}

/**
 * Compact weather badge showing icon and temperature range.
 * Shows weather popup on hover with mouse-tracked positioning.
 *
 * @param props - Forecast data, display options, and date labels.
 * @returns Weather badge UI with hover popup.
 *
 * @example
 * ```tsx
 * <DayWeatherBadge forecast={dayForecast} isToday={true} dateLabel="Today" dateSublabel="Aug 20" />
 * ```
 */
export function DayWeatherBadge({
  forecast,
  isToday = false,
  dateLabel,
  dateSublabel,
  iconSize = 'sm',
}: DayWeatherBadgeProps) {
  const { popupRef, handleMouseEnter, handleMouseMove, handleMouseLeave } = useWeatherPopup()
  const iconColor = isToday ? 'text-warning' : 'text-text-muted'

  return (
    <>
      <div
        className="relative flex items-center gap-1 text-xs text-text-muted cursor-pointer"
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <WeatherIcon condition={forecast.condition as WeatherCondition} size={iconSize} className={iconColor} />
        <span className="font-medium text-text-primary">{Math.round(forecast.high)}°</span>
        <span>{Math.round(forecast.low)}°</span>
      </div>

      {/* Weather popup with fixed positioning to escape parent containers */}
      <div
        ref={popupRef}
        className="fixed z-50 opacity-0 transition-opacity duration-100"
        style={{ left: -9999, top: -9999 }}
      >
        <WeatherPopup forecast={forecast} dateLabel={dateLabel} dateSublabel={dateSublabel} />
      </div>
    </>
  )
}
