/**
 * MonthView component for displaying a full month calendar grid.
 *
 * Shows a traditional month grid with weekly density column on the left,
 * inline event lists with member avatars, event count badges, and hover
 * popups for event details. Clicking a day navigates to day view.
 */

import { useState, useCallback } from 'react'
import type { CalendarEvent, FamilyMember } from '../../types'
import {
  colors,
  spacing,
  radii,
  typography,
  densityBarColors,
  memberColors,
} from '../../theme/tokens'
import { isSameDay } from '../../utils/dateFormat'
import { getRelativeDensity } from '../../utils/density'
import { EventPopup } from '../EventPopup'

interface MonthViewProps {
  /** The current month to display. */
  currentDate: Date
  /** Calendar events to display. */
  events: CalendarEvent[]
  /** Family members for resolving member info. */
  members: FamilyMember[]
  /** Callback when a day is clicked. */
  onDayClick: (date: Date) => void
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
    const lastDate = dates[dates.length - 1]
    const next = new Date(lastDate)
    next.setDate(next.getDate() + 1)
    dates.push(next)
  }

  return dates
}

/**
 * Gets events for a specific date.
 */
function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter((e) => isSameDay(new Date(e.start), date))
}

/**
 * MonthView component.
 *
 * @param props - Component props.
 * @returns The month view UI.
 */
export function MonthView({ currentDate, events, members, onDayClick }: MonthViewProps) {
  const [popupState, setPopupState] = useState<{
    visible: boolean
    x: number
    y: number
    date: Date | null
  }>({ visible: false, x: 0, y: 0, date: null })

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

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent, date: Date) => {
      const dayEvents = getEventsForDate(events, date)
      // Use functional update to ensure we always have the latest state
      setPopupState(() => {
        if (dayEvents.length > 0) {
          return { visible: true, x: e.clientX, y: e.clientY, date }
        }
        return { visible: false, x: 0, y: 0, date: null }
      })
    },
    [events],
  )

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setPopupState((prev) => {
      if (!prev.visible) return prev
      return { ...prev, x: e.clientX, y: e.clientY }
    })
  }, [])

  const handleGridMouseLeave = useCallback(() => {
    setPopupState(() => ({ visible: false, x: 0, y: 0, date: null }))
  }, [])

  const weekdayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  return (
    <div onMouseLeave={handleGridMouseLeave} style={{ display: 'flex', gap: `${spacing.sm}px` }}>
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
          const density = getRelativeDensity(weekCounts[idx], weekCounts)
          return (
            <div
              key={idx}
              style={{
                flex: 1,
                minHeight: '120px',
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {gridDates.map((date, idx) => {
            const isCurrentMonth = date.getMonth() === month
            const isToday = isSameDay(date, today)
            const dayEvents = getEventsForDate(events, date)
            const isHovered = popupState.date && isSameDay(popupState.date, date)

            return (
              <div
                key={idx}
                onClick={() => onDayClick(date)}
                onMouseEnter={(e) => handleMouseEnter(e, date)}
                onMouseMove={handleMouseMove}
                style={{
                  minHeight: '120px',
                  padding: `${spacing.sm}px`,
                  borderRight: idx % 7 !== 6 ? `1px solid ${colors.borderLight}` : 'none',
                  borderBottom: idx < 35 ? `1px solid ${colors.borderLight}` : 'none',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                  position: 'relative',
                  background: isToday
                    ? colors.primaryLight
                    : isHovered
                      ? colors.bgHover
                      : isCurrentMonth
                        ? 'transparent'
                        : '#fafafa',
                }}
              >
                {/* Date number */}
                <div
                  style={{
                    fontSize: `${typography.monthCellDate.size}px`,
                    fontWeight: typography.monthCellDate.weight,
                    color: isCurrentMonth ? colors.textSecondary : colors.textDisabled,
                    marginBottom: '6px',
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

                {/* Event count badge */}
                {dayEvents.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
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

                {/* Inline event list */}
                {dayEvents.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                      marginTop: '4px',
                    }}
                  >
                    {dayEvents.slice(0, 3).map((event) => {
                      const eventMembers = members.filter((m) => event.members.includes(m.key))
                      const primaryMember = eventMembers[0]
                      const mc = primaryMember ? memberColors[primaryMember.key] : null

                      return (
                        <div
                          key={event.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '10px',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            borderLeft: `2px solid ${mc ? mc.avatar : colors.border}`,
                            background: mc ? mc.bg : colors.bgHover,
                            color: mc ? mc.text : colors.textMuted,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {primaryMember && (
                            <span
                              style={{
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                fontSize: '7px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: colors.white,
                                fontWeight: 600,
                                backgroundColor: primaryMember.color,
                                flexShrink: 0,
                              }}
                            >
                              {primaryMember.initial}
                            </span>
                          )}
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {event.title}
                          </span>
                        </div>
                      )
                    })}
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

      {/* Event popup - key forces full re-render when date changes */}
      {popupState.date && (
        <EventPopup
          key={popupState.date.toISOString()}
          visible={popupState.visible}
          x={popupState.x}
          y={popupState.y}
          dateLabel={popupState.date.toLocaleDateString('en-US', {
            weekday: 'short',
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
