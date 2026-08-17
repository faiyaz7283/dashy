/**
 * MonthView component for displaying a full month calendar grid.
 *
 * Shows a traditional month grid with weekly density column on the left,
 * inline event strips (EventItem), event count badges, and hover popups for
 * event details. Clicking an event strip opens the event modal; clicking a
 * day cell navigates to day view.
 */

import { useState } from 'react'
import type { CalendarEvent, DailyForecast, FamilyMember } from '@/types'
import { colors, spacing, radii, typography, densityBarColors } from '@/theme/tokens'
import { LOCALE } from '@/theme/config'
import { isSameDay } from '@/shared/utils/dateFormat'
import { getRelativeDensity } from '@/shared/utils/density'
import { getEventsForDate } from '@/domain/calendar/utils'
import { getWeatherForDate } from '@/domain/weather/utils'
import { EventItem } from '@/features/calendar/components/EventItem'
import { EventPopup } from '@/features/calendar/components/EventPopup'
import { EventModal } from '@/features/calendar/components/EventModal'
import { WeatherIcon } from '@/features/weather/components/WeatherWidget/WeatherIcon'
import { WeatherTooltip } from '@/features/weather/components/WeatherTooltip'
import { useEventInteraction } from '@/features/calendar/hooks/useEventInteraction'
import { useWeatherTooltip } from '@/features/weather/hooks/useWeatherTooltip'

interface MonthViewProps {
  /** The current month to display. */
  currentDate: Date
  /** Calendar events to display. */
  events: CalendarEvent[]
  /** Family members for resolving member info. */
  members: FamilyMember[]
  /** Callback when a day is clicked. */
  onDayClick: (date: Date) => void
  /** Weather forecast data. */
  weatherForecast?: DailyForecast[]
}

/**
 * Returns all dates to display in a month grid (including padding days).
 *
 * @param year - The year.
 * @param month - The month (0-11).
 * @returns Array of dates for the grid.
 */
function getMonthGridDates(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDay = firstDay.getDay()
  const paddingStart = startDay === 0 ? 6 : startDay - 1 // Monday start

  const dates: Date[] = []

  // Padding days from previous month
  for (let i = paddingStart; i > 0; i--) {
    const d = new Date(year, month, 1 - i)
    dates.push(d)
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    dates.push(new Date(year, month, d))
  }

  // Padding days from next month to fill 6 rows
  while (dates.length < 42) {
    const lastDate = dates[dates.length - 1]!
    const next = new Date(lastDate)
    next.setDate(next.getDate() + 1)
    dates.push(next)
  }

  return dates
}

/**
 * MonthView component.
 *
 * @param props - Component props.
 * @returns The month view UI.
 */
export function MonthView({
  currentDate,
  events,
  members,
  onDayClick,
  weatherForecast,
}: MonthViewProps) {
  const [hoveredEvent, setHoveredEvent] = useState<CalendarEvent | null>(null)
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 })
  const { selectedEvent, openEvent, closeEvent } = useEventInteraction(events)

  const { tooltipState, showTooltip, hideTooltip } = useWeatherTooltip()

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const today = new Date()
  const gridDates = getMonthGridDates(year, month)

  // Group dates into weeks for density calculation
  const weeks: Date[][] = []
  for (let i = 0; i < gridDates.length; i += 7) {
    weeks.push(gridDates.slice(i, i + 7))
  }

  // Calculate weekly event counts for density
  const weekCounts = weeks.map((week) =>
    week.reduce((sum, date) => sum + getEventsForDate(events, date).length, 0),
  )

  const weekdayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div style={{ display: 'flex', gap: `${spacing.sm}px`, height: '100%' }}>
      {/* Weekly density column */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          width: '8px',
          paddingTop: '41px', // Align with grid body
        }}
      >
        {weeks.map((_, idx) => {
          const density = getRelativeDensity(weekCounts[idx]!, weekCounts)
          return (
            <div
              key={idx}
              style={{
                flex: 1,
                borderRadius: `${radii.sm}px`,
                background: densityBarColors[density],
              }}
            />
          )
        })}
      </div>

      {/* Month grid */}
      <div
        style={{
          flex: 1,
          background: colors.white,
          borderRadius: `${radii['2xl']}px`,
          border: `1px solid ${colors.border}`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Weekday headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          {weekdayHeaders.map((day) => (
            <div
              key={day}
              style={{
                padding: '10px',
                textAlign: 'center',
                fontSize: `${typography.monthHeaderCell.size}px`,
                fontWeight: typography.monthHeaderCell.weight,
                color: colors.textFaint,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Date cells */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gridTemplateRows: 'repeat(6, 1fr)',
            flex: 1,
            minHeight: 0,
          }}
        >
          {gridDates.map((date, idx) => {
            const isCurrentMonth = date.getMonth() === month
            const isToday = isSameDay(date, today)
            const dayEvents = getEventsForDate(events, date)
            const dayWeather = getWeatherForDate(weatherForecast, date)
            const isHovered = hoveredEvent && dayEvents.some((e) => e.id === hoveredEvent.id)

            return (
              <div
                key={idx}
                onClick={() => onDayClick(date)}
                style={{
                  padding: `${spacing.sm}px`,
                  minHeight: 0,
                  borderRight: idx % 7 !== 6 ? `1px solid ${colors.borderLight}` : 'none',
                  borderBottom: idx < 35 ? `1px solid ${colors.borderLight}` : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  position: 'relative',
                  overflow: 'hidden',
                  background: isToday
                    ? colors.primaryLight
                    : isHovered
                      ? colors.bgHover
                      : isCurrentMonth
                        ? 'transparent'
                        : '#fafafa',
                }}
              >
                {/* Top row: date number (left), weather (center), event count (right) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                    position: 'relative',
                  }}
                >
                  {/* Left: date number */}
                  <div
                    style={{
                      fontSize: `${typography.monthCellDate.size}px`,
                      fontWeight: typography.monthCellDate.weight,
                      color: isCurrentMonth ? colors.textSecondary : colors.textDisabled,
                      ...(isToday
                        ? {
                            background: colors.primary,
                            color: colors.white,
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                          }
                        : {}),
                    }}
                  >
                    {date.getDate()}
                  </div>

                  {/* Center: weather - absolutely positioned for true center */}
                  {dayWeather && isCurrentMonth && (
                    <div
                      onMouseEnter={(e) => showTooltip(dayWeather, e.clientX, e.clientY)}
                      onMouseLeave={hideTooltip}
                      className="hover-bg"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        position: 'absolute',
                        left: '50%',
                        transform: 'translateX(-50%)',
                      }}
                    >
                      <WeatherIcon condition={dayWeather.icon} size="small" />
                      <span style={{ color: colors.textSecondary, fontWeight: 500 }}>
                        {Math.round(dayWeather.high)}°
                      </span>
                      <span style={{ color: colors.textMuted }}>{Math.round(dayWeather.low)}°</span>
                    </div>
                  )}

                  {/* Right: event count badge */}
                  {dayEvents.length > 0 && (
                    <div
                      style={{
                        background: isToday ? colors.primaryLight : colors.bgHover,
                        color: isToday ? colors.primary : colors.textMuted,
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '999px',
                      }}
                    >
                      {dayEvents.length}
                    </div>
                  )}
                </div>

                {/* Inline event list */}
                {dayEvents.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      marginTop: '4px',
                      flex: 1,
                      overflowY: 'auto',
                      minHeight: 0,
                      paddingBottom: '4px',
                    }}
                  >
                    {dayEvents.slice(0, 3).map((event) => (
                      <EventItem
                        key={event.id}
                        event={event}
                        members={members}
                        variant="strip"
                        onClick={openEvent}
                        onMouseEnter={(e) => {
                          setHoveredEvent(event)
                          setPopupPos({ x: e.clientX, y: e.clientY })
                        }}
                        onMouseMove={(e) => setPopupPos({ x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setHoveredEvent(null)}
                      />
                    ))}
                    {dayEvents.length > 3 && (
                      <div
                        style={{ fontSize: '10px', color: colors.textFaint, paddingLeft: '6px' }}
                      >
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Event popup - shows only the hovered event */}
      {hoveredEvent && (
        <EventPopup
          key={hoveredEvent.id}
          visible={true}
          x={popupPos.x}
          y={popupPos.y}
          dateLabel={new Date(hoveredEvent.start).toLocaleDateString(LOCALE, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
          events={[hoveredEvent]}
          members={members}
        />
      )}

      {/* Event detail modal */}
      <EventModal
        visible={selectedEvent !== null}
        event={selectedEvent}
        members={members}
        onClose={closeEvent}
      />

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
