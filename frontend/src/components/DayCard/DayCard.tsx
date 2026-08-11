import type { CalendarEvent, DailyForecast, FamilyMember } from '../../types'
import type { DensityLevel } from '../../theme/config'
import { EventItem } from '../EventItem'
import { WeatherIcon } from '../WeatherWidget/WeatherIcon'
import { colors, radii, spacing, typography, densityBarColors } from '../../theme/tokens'
import { getShortWeekday } from '../../utils/dateFormat'
import { useWeatherTooltip } from '../../hooks/useWeatherTooltip'
import { WeatherTooltip } from '../WeatherTooltip'

interface DayCardProps {
  date: Date
  events: CalendarEvent[]
  members: FamilyMember[]
  isToday: boolean
  isNextWeek?: boolean
  /** End date for next week range (used when isNextWeek is true). */
  nextWeekEnd?: Date
  /** Density level for the density bar indicator. */
  density?: DensityLevel
  /** Weather forecast for this day. */
  weatherForecast?: DailyForecast
  /** Callback when the card is clicked. */
  onClick?: () => void
  /** Callback when an event is clicked (opens the event modal). */
  onEventClick?: (event: CalendarEvent) => void
  /** Callback when an event is hovered (shows the day popup). */
  onEventMouseEnter?: (e: React.MouseEvent, date: Date) => void
  onEventMouseMove?: (e: React.MouseEvent) => void
  onEventMouseLeave?: (e: React.MouseEvent) => void
}

export function DayCard({
  date,
  events,
  members,
  isToday,
  isNextWeek,
  nextWeekEnd,
  density = 'none',
  weatherForecast,
  onClick,
  onEventClick,
  onEventMouseEnter,
  onEventMouseMove,
  onEventMouseLeave,
}: DayCardProps) {
  const dayName = getShortWeekday(date)
  const dayNum = date.getDate()
  const eventCount = events.length
  const { tooltipState, showTooltip, hideTooltip } = useWeatherTooltip()

  // Format date range for next week card
  const formatNextWeekRange = () => {
    if (!nextWeekEnd) return 'Next week'
    const startDay = date.getDate()
    const endDay = nextWeekEnd.getDate()
    const startMonth = date.toLocaleDateString('en-US', { month: 'short' })
    const endMonth = nextWeekEnd.toLocaleDateString('en-US', { month: 'short' })
    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} – ${endDay}`
    }
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}`
  }

  return (
    <div
      onClick={onClick}
      style={{
        borderRadius: `${radii['2xl']}px`,
        border: `1px solid ${isNextWeek ? colors.borderDark : colors.border}`,
        borderStyle: isNextWeek ? 'dashed' : 'solid',
        padding: `${spacing.lg}px`,
        background: colors.white,
        opacity: isNextWeek ? 0.7 : 1,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'box-shadow 0.15s, transform 0.1s',
        minHeight: 0,
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (!isNextWeek && onClick) {
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
          e.currentTarget.style.transform = 'translateY(-1px)'
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none'
        e.currentTarget.style.transform = 'none'
      }}
    >
      {/* Day header: day name/number on left, weather centered, event count on right */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: `${spacing.md}px`,
          position: 'relative',
        }}
      >
        {/* Left: day name and number */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {!isNextWeek && (
            <span
              style={{
                fontSize: `${typography.dayCardTitle.size}px`,
                fontWeight: typography.dayCardTitle.weight,
                color: colors.textPrimary,
              }}
            >
              {dayName}
            </span>
          )}
          {!isNextWeek && (
            <span
              style={{
                fontSize: isToday
                  ? `${typography.dayCardTitle.size}px`
                  : `${typography.dayCardTitle.size}px`,
                fontWeight: typography.dayCardTitle.weight,
                color: isToday ? colors.white : colors.textPrimary,
                background: isToday ? colors.primary : 'transparent',
                width: isToday ? '28px' : 'auto',
                height: isToday ? '28px' : 'auto',
                borderRadius: isToday ? '50%' : '0',
                display: isToday ? 'inline-flex' : 'inline',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {dayNum}
            </span>
          )}
          {isNextWeek && (
            <span
              style={{
                fontSize: `${typography.dayCardTitle.size}px`,
                fontWeight: typography.dayCardTitle.weight,
                color: colors.textPrimary,
              }}
            >
              {formatNextWeekRange()}
            </span>
          )}
        </div>
        {/* Center: weather */}
        {!isNextWeek && weatherForecast && (
          <div
            onMouseEnter={(e) => showTooltip(weatherForecast, e.clientX, e.clientY)}
            onMouseLeave={hideTooltip}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: '6px',
              transition: 'background 0.15s',
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = colors.bgHover
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <WeatherIcon condition={weatherForecast.icon} className="" />
            <span style={{ fontSize: '12px', fontWeight: 500, color: colors.textSecondary }}>
              {Math.round(weatherForecast.high)}°
            </span>
            <span style={{ fontSize: '11px', color: colors.textMuted }}>
              {Math.round(weatherForecast.low)}°
            </span>
          </div>
        )}
        {/* Right: event count badge */}
        {!isNextWeek && (
          <span
            style={{
              fontSize: `${typography.badge.size}px`,
              fontWeight: typography.badge.weight,
              padding: '2px 8px',
              borderRadius: '999px',
              background: isToday ? colors.primaryLight : colors.bgHover,
              color: isToday ? colors.primary : colors.textMuted,
            }}
          >
            {eventCount} event{eventCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Density bar */}
      {!isNextWeek && (
        <div
          style={{
            height: '4px',
            borderRadius: '2px',
            background: densityBarColors[density],
            marginBottom: `${spacing.md}px`,
          }}
        />
      )}

      {/* Events */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${spacing.sm}px` }}>
        {events.map((event) => (
          <EventItem
            key={event.id}
            event={event}
            members={members}
            variant="card"
            onClick={onEventClick}
            onMouseEnter={onEventMouseEnter ? (e) => onEventMouseEnter(e, date) : undefined}
            onMouseMove={onEventMouseMove}
            onMouseLeave={onEventMouseLeave}
          />
        ))}
      </div>

      {/* Weather tooltip */}
      <WeatherTooltip
        forecast={tooltipState.forecast}
        visible={tooltipState.visible}
        x={tooltipState.x}
        y={tooltipState.y}
      />
    </div>
  )
}
