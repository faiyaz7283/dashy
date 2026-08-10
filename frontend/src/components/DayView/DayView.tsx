/**
 * DayView component for displaying a single day's hourly timeline.
 *
 * Shows an hourly timeline with events positioned by time, an all-day events
 * section, a current time indicator (red line), and auto-scroll to current time.
 * Hovering an event shows a popup; clicking an event opens the detail modal.
 */

import { useState, useEffect, useRef } from 'react'
import type { CalendarEvent, FamilyMember } from '../../types'
import { colors, spacing, radii, typography, layout, zIndices } from '../../theme/tokens'
import { themeConfig } from '../../theme/config'
import { isSameDay } from '../../utils/dateFormat'
import { EventItem } from '../EventItem'
import { EventPopup } from '../EventPopup'
import { EventModal } from '../EventModal'
import { useEventInteraction } from '../../hooks/useEventInteraction'

interface DayViewProps {
  /** The date to display. */
  currentDate: Date
  /** Calendar events to display. */
  events: CalendarEvent[]
  /** Family members for resolving member info. */
  members: FamilyMember[]
}

/**
 * Gets timed events for a date (non-all-day).
 */
function getTimedEvents(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter((e) => isSameDay(new Date(e.start), date) && !e.all_day)
}

/**
 * Gets all events for a specific date.
 */
function getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter((e) => isSameDay(new Date(e.start), date))
}

/**
 * Calculates the top position (px) for an event based on its start time.
 */
function getEventTopPx(event: CalendarEvent): number {
  const start = new Date(event.start)
  const hours = start.getHours()
  const minutes = start.getMinutes()
  const { timelineStartHour, timelineHourHeight } = {
    timelineStartHour: themeConfig.calendar.timelineStartHour,
    timelineHourHeight: layout.timelineHourHeight,
  }
  return (hours - timelineStartHour) * timelineHourHeight + (minutes / 60) * timelineHourHeight
}

/**
 * Calculates the height (px) for an event based on its duration.
 */
function getEventHeightPx(event: CalendarEvent): number {
  const start = new Date(event.start)
  const end = new Date(event.end)
  const durationMinutes = (end.getTime() - start.getTime()) / 60000
  const pxPerMinute = layout.timelineHourHeight / 60
  return Math.max(durationMinutes * pxPerMinute, 20) // Minimum 20px
}

/**
 * DayView component.
 *
 * @param props - Component props.
 * @returns The day view UI.
 */
export function DayView({ currentDate, events, members }: DayViewProps) {
  const {
    popupState,
    selectedEvent,
    handleDayMouseEnter,
    handleMouseMove,
    handleMouseLeave,
    openEvent,
    closeEvent,
  } = useEventInteraction(events)
  const [currentTimeTop, setCurrentTimeTop] = useState<number>(0)
  const timelineRef = useRef<HTMLDivElement>(null)

  const today = new Date()
  const isToday = isSameDay(currentDate, today)
  const allDayEvents = events.filter((e) => isSameDay(new Date(e.start), currentDate) && e.all_day)
  const timedEvents = getTimedEvents(events, currentDate)

  const { timelineStartHour, timelineEndHour, timelineScrollOffset } = themeConfig.calendar
  const hours = Array.from(
    { length: timelineEndHour - timelineStartHour + 1 },
    (_, i) => timelineStartHour + i,
  )

  // Update current time indicator position
  useEffect(() => {
    if (!isToday) return

    const updateTime = () => {
      const now = new Date()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      const top =
        (hours - timelineStartHour) * layout.timelineHourHeight +
        (minutes / 60) * layout.timelineHourHeight
      setCurrentTimeTop(top)
    }

    updateTime()
    const interval = setInterval(updateTime, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [isToday, timelineStartHour])

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (!isToday || !timelineRef.current) return

    const scrollPosition = Math.max(0, currentTimeTop - timelineScrollOffset)
    timelineRef.current.scrollTop = scrollPosition
  }, [isToday, currentTimeTop, timelineScrollOffset])

  const formatHour = (hour: number): string => {
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour
    return `${displayHour} ${ampm}`
  }

  return (
    <div
      onMouseLeave={handleMouseLeave}
      style={{ display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      {/* Timeline container with sticky all-day section */}
      <div
        ref={timelineRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        {/* All-day events section - sticky at top of scrollable timeline */}
        {allDayEvents.length > 0 && (
          <div
            style={{
              background: colors.bg,
              borderTop: `1px solid ${colors.border}`,
              borderBottom: `1px solid ${colors.border}`,
              padding: `${spacing.sm}px ${spacing.xl}px`,
              position: 'sticky',
              top: 0,
              zIndex: zIndices.stickyArea + 1,
              marginBottom: `${spacing.lg}px`,
            }}
          >
            <div
              style={{
                fontSize: `${typography.allDayLabel.size}px`,
                fontWeight: typography.allDayLabel.weight,
                color: colors.textFaint,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px',
              }}
            >
              All-day
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {allDayEvents.map((event) => (
                <EventItem
                  key={event.id}
                  event={event}
                  members={members}
                  variant="card"
                  size="sm"
                  showTime={false}
                  onClick={openEvent}
                  onMouseEnter={(e) => handleDayMouseEnter(e, currentDate)}
                  onMouseMove={handleMouseMove}
                  onMouseLeave={handleMouseLeave}
                />
              ))}
            </div>
          </div>
        )}
        <div
          style={{
            background: colors.white,
            border: `1px solid ${colors.border}`,
            borderRadius: `${radii['2xl']}px`,
            margin: `${spacing.lg}px ${spacing.xl}px 0`,
            position: 'relative',
          }}
        >
          {/* Hour rows */}
          {hours.map((hour) => (
            <div
              key={hour}
              style={{
                display: 'flex',
                borderBottom: `1px solid ${colors.borderLight}`,
                minHeight: `${layout.timelineHourHeight}px`,
                position: 'relative',
              }}
            >
              {/* Time label */}
              <div
                style={{
                  width: `${layout.timelineLabelWidth}px`,
                  flexShrink: 0,
                  padding: `${spacing.sm}px ${spacing.md}px 0 0`,
                  textAlign: 'right',
                  fontSize: `${typography.timelineLabel.size}px`,
                  color: colors.textFaint,
                  fontWeight: typography.timelineLabel.weight,
                }}
              >
                {formatHour(hour)}
              </div>

              {/* Time slot */}
              <div
                style={{
                  flex: 1,
                  position: 'relative',
                  borderLeft: `1px solid ${colors.borderLight}`,
                  cursor: 'pointer',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.bgHover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                }}
              />
            </div>
          ))}

          {/* Event blocks */}
          {timedEvents.map((event) => {
            const top = getEventTopPx(event)
            const height = getEventHeightPx(event)

            return (
              <EventItem
                key={event.id}
                event={event}
                members={members}
                variant="block"
                style={{
                  position: 'absolute',
                  left: `${layout.timelineLabelWidth + 4}px`,
                  right: '4px',
                  top: `${top}px`,
                  height: `${height}px`,
                }}
                onClick={openEvent}
                onMouseEnter={(e) => handleDayMouseEnter(e, currentDate)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              />
            )
          })}

          {/* Current time indicator */}
          {isToday && (
            <div
              style={{
                position: 'absolute',
                left: `${layout.timelineLabelWidth}px`,
                right: 0,
                top: `${currentTimeTop}px`,
                height: '2px',
                background: colors.danger,
                zIndex: zIndices.currentTimeLine,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: '-5px',
                  top: '-4px',
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: colors.danger,
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Event popup - shown when hovering events */}
      {popupState.date && (
        <EventPopup
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

      {/* Event detail modal */}
      <EventModal
        visible={selectedEvent !== null}
        event={selectedEvent}
        members={members}
        onClose={closeEvent}
      />
    </div>
  )
}
