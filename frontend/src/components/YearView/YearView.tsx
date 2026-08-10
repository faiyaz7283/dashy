/**
 * YearView component for displaying a full year calendar overview.
 *
 * Shows a 4×3 grid of mini-calendars (one per month) with weekly density bars
 * on the left of each mini-cal, segmented event indicators (DayIndicator) on
 * dates, event count badges next to month names, and hover popups on event
 * days. Clicking a month navigates to month view; clicking a day navigates
 * to day view.
 */

import type { CalendarEvent, FamilyMember } from '../../types'
import { colors, spacing, radii, typography, densityBarColors, shadows } from '../../theme/tokens'
import { themeConfig } from '../../theme/config'
import { isSameDay } from '../../utils/dateFormat'
import { getRelativeDensity } from '../../utils/density'
import { DayIndicator } from '../DayIndicator'
import { EventPopup } from '../EventPopup'
import { useEventInteraction } from '../../hooks/useEventInteraction'

interface YearViewProps {
  /** The current year to display. */
  currentDate: Date
  /** Calendar events to display. */
  events: CalendarEvent[]
  /** Family members for resolving member info. */
  members: FamilyMember[]
  /** Callback when a month is clicked. */
  onMonthClick: (month: number) => void
  /** Callback when a day is clicked. */
  onDayClick: (date: Date) => void
  /** Screen orientation — controls the month grid columns. */
  orientation?: 'landscape' | 'portrait'
}

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/**
 * Mini-calendar density colors and sizing come from the theme tokens. The UI
 * scales uniformly on large monitors via the root-level zoom (useUiScale), so
 * this component uses fixed design sizes like every other view.
 */

/**
 * Returns the days to display in a mini-calendar grid for a month.
 *
 * Includes leading/trailing days from adjacent months to fill complete weeks.
 */
function getMiniCalDays(
  year: number,
  month: number,
): Array<{ day: number; otherMonth: boolean; date: Date }> {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = firstDay.getDay()
  const paddingStart = startDow === 0 ? 6 : startDow - 1 // Monday start

  const days: Array<{ day: number; otherMonth: boolean; date: Date }> = []

  // Leading days from previous month
  for (let i = paddingStart; i > 0; i--) {
    const d = new Date(year, month, 1 - i)
    days.push({ day: d.getDate(), otherMonth: true, date: d })
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ day: d, otherMonth: false, date: new Date(year, month, d) })
  }

  // Trailing days to fill complete weeks
  while (days.length % 7 !== 0) {
    const lastDate = days[days.length - 1].date
    const next = new Date(lastDate)
    next.setDate(next.getDate() + 1)
    days.push({ day: next.getDate(), otherMonth: true, date: next })
  }

  return days
}

/**
 * Gets events for a specific date.
 */
function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter((e) => isSameDay(new Date(e.start), date))
}

/**
 * YearView component.
 *
 * @param props - Component props.
 * @returns The year view UI.
 */
export function YearView({
  currentDate,
  events,
  members,
  onMonthClick,
  onDayClick,
  orientation = 'landscape',
}: YearViewProps) {
  const { popupState, handleDayMouseEnter, handleMouseMove, handleMouseLeave } =
    useEventInteraction(events)

  const year = currentDate.getFullYear()
  const today = new Date()
  const selectedMonth = currentDate.getMonth()
  const currentMonth = today.getMonth()
  const cols =
    orientation === 'landscape'
      ? themeConfig.calendar.yearGridLandscape
      : themeConfig.calendar.yearGridPortrait
  const rows = 12 / cols

  // Calculate event counts per month for density
  const monthEventCounts = Array.from({ length: 12 }, (_, m) => {
    return events.filter((e) => {
      const d = new Date(e.start)
      return d.getFullYear() === year && d.getMonth() === m
    }).length
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Year grid: 4×3 landscape / 3×4 portrait, stretched to fill available height */}
      <div
        onMouseLeave={handleMouseLeave}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          gap: '20px',
          flex: 1,
          minHeight: 0,
        }}
      >
        {Array.from({ length: 12 }, (_, monthIdx) => {
          const days = getMiniCalDays(year, monthIdx)
          const weeks: (typeof days)[] = []
          for (let i = 0; i < days.length; i += 7) {
            weeks.push(days.slice(i, i + 7))
          }

          // Weekly event counts for density
          const weekCounts = weeks.map(
            (week) =>
              week.filter((d) => !d.otherMonth && getEventsForDate(events, d.date).length > 0)
                .length,
          )

          // Month is "selected" if it matches the currently navigated date's month
          const isSelectedMonth = monthIdx === selectedMonth
          // Past/present/future coloring for month cards
          const isPastMonth =
            year < today.getFullYear() || (year === today.getFullYear() && monthIdx < currentMonth)
          const monthDensity = getRelativeDensity(monthEventCounts[monthIdx], monthEventCounts)

          // Month card border/color follows selected date's month
          const monthBorderColor = isSelectedMonth ? colors.primary : colors.border
          const monthTitleColor = isSelectedMonth
            ? colors.primary
            : isPastMonth
              ? colors.textMuted
              : colors.textPrimary

          return (
            <div
              key={monthIdx}
              onClick={() => onMonthClick(monthIdx)}
              style={{
                background: colors.white,
                border: `1px solid ${monthBorderColor}`,
                borderRadius: `${radii['2xl']}px`,
                padding: `${spacing.lg}px`,
                cursor: 'pointer',
                transition: 'box-shadow 0.15s, transform 0.1s',
                boxShadow: isSelectedMonth ? `0 0 0 1px ${colors.primary}` : 'none',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = shadows.cardHover
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = isSelectedMonth
                  ? `0 0 0 1px ${colors.primary}`
                  : 'none'
                e.currentTarget.style.transform = 'none'
              }}
            >
              {/* Month header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: `${spacing.md}px`,
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    fontWeight: 600,
                    color: monthTitleColor,
                  }}
                >
                  {monthNames[monthIdx]}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: '10px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    marginLeft: '8px',
                    background: isSelectedMonth
                      ? monthDensity === 'none'
                        ? '#e0e7ff'
                        : densityBarColors[monthDensity]
                      : densityBarColors[monthDensity],
                    color: isSelectedMonth
                      ? monthDensity === 'none'
                        ? colors.primary
                        : colors.textPrimary
                      : colors.textPrimary,
                  }}
                >
                  {monthEventCounts[monthIdx]} events
                </span>
              </div>

              {/* Mini calendar with density column */}
              <div style={{ display: 'flex', gap: '4px', flex: 1, minHeight: 0 }}>
                {/* Density column */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1px',
                    width: '6px',
                    paddingTop: '17px', // Align with day cells
                  }}
                >
                  {weeks.map((_, weekIdx) => {
                    const weekDensity = getRelativeDensity(weekCounts[weekIdx], weekCounts)
                    return (
                      <div
                        key={weekIdx}
                        style={{
                          flex: 1,
                          minHeight: '18px',
                          borderRadius: '2px',
                          background: densityBarColors[weekDensity],
                        }}
                      />
                    )
                  })}
                </div>

                {/* Calendar grid */}
                <div
                  style={{
                    flex: 1,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(7, 1fr)',
                    gridTemplateRows: `auto repeat(${weeks.length}, minmax(0, 1fr))`,
                    gap: '1px',
                  }}
                >
                  {/* Weekday headers */}
                  {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                    <div
                      key={i}
                      style={{
                        textAlign: 'center',
                        fontSize: `${typography.miniWeekday.size}px`,
                        fontWeight: typography.miniWeekday.weight,
                        color: colors.textFaint,
                        textTransform: 'uppercase',
                        padding: '2px 0',
                      }}
                    >
                      {d}
                    </div>
                  ))}

                  {/* Day cells */}
                  {days.map((dayData, idx) => {
                    const dayEvents = getEventsForDate(events, dayData.date)
                    const hasEvents = dayEvents.length > 0 && !dayData.otherMonth
                    const isToday = isSameDay(dayData.date, today)

                    return (
                      <div
                        key={idx}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (!dayData.otherMonth) {
                            onDayClick(dayData.date)
                          }
                        }}
                        onMouseEnter={(e) => {
                          if (!dayData.otherMonth) {
                            if (!isToday) {
                              e.currentTarget.style.background = colors.bgHover
                            }
                            handleDayMouseEnter(e, dayData.date)
                          }
                        }}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={(e) => {
                          if (!isToday) {
                            e.currentTarget.style.background = 'transparent'
                          }
                          // Don't clear popup here — parent grid handles it
                        }}
                        style={{
                          textAlign: 'center',
                          fontSize: `${typography.miniDay.size}px`,
                          color: dayData.otherMonth ? colors.textDisabled : colors.textSecondary,
                          padding: '0',
                          position: 'relative',
                          cursor: dayData.otherMonth ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '100%',
                          borderRadius: '4px',
                        }}
                      >
                        {/* Event indicator — segmented micro-bar */}
                        {hasEvents && <DayIndicator events={dayEvents} members={members} />}
                        <span
                          style={
                            isToday
                              ? {
                                  background: colors.primary,
                                  color: colors.white,
                                  fontWeight: 700,
                                  width: '2em',
                                  height: '2em',
                                  borderRadius: '50%',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }
                              : undefined
                          }
                        >
                          {dayData.day}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Event popup - key forces full re-render when date changes */}
      {popupState.date && (
        <EventPopup
          key={popupState.date.toISOString()}
          visible={popupState.visible}
          x={popupState.x}
          y={popupState.y}
          dateLabel={popupState.date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
          events={getEventsForDate(events, popupState.date)}
          members={members}
        />
      )}
    </div>
  )
}
