/**
 * DayView component for displaying a single day's hourly timeline.
 *
 * Shows an hourly timeline with events positioned by time, an all-day events
 * section, a current time indicator (red line), and auto-scroll to current time.
 * Hovering an event shows a popup; clicking an event opens the detail modal.
 */

import { useState, useEffect, useRef } from 'react'
import type { CalendarEvent, DailyForecast, FamilyMember } from '../../types'
import { colors, spacing, radii, typography, layout, zIndices } from '../../theme/tokens'
import { themeConfig } from '../../theme/config'
import { isSameDay } from '../../utils/dateFormat'
import { EventItem } from '../EventItem'
import { EventPopup } from '../EventPopup'
import { EventModal } from '../EventModal'
import { WeatherIcon } from '../WeatherWidget/WeatherIcon'
import { WeatherTooltip } from '../WeatherTooltip'
import { useEventInteraction } from '../../hooks/useEventInteraction'
import { useWeatherTooltip } from '../../hooks/useWeatherTooltip'

interface DayViewProps {
  /** The date to display. */
  currentDate: Date
  /** Calendar events to display. */
  events: CalendarEvent[]
  /** Family members for resolving member info. */
  members: FamilyMember[]
  /** Weather forecast data. */
  weatherForecast?: DailyForecast[]
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
 * Gets weather forecast for a specific date.
 * Uses UTC date components to match backend's UTC-based date formatting.
 */
function getWeatherForDate(
  forecast: DailyForecast[] | undefined,
  date: Date,
): DailyForecast | undefined {
  if (!forecast) return undefined
  const dateStr = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
  return forecast.find((f) => f.date === dateStr)
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
export function DayView({ currentDate, events, members, weatherForecast }: DayViewProps) {
  const {
    popupState,
    selectedEvent,
    handleDayMouseEnter,
    handleMouseMove,
    handleMouseLeave,
    openEvent,
    closeEvent,
  } = useEventInteraction(events)
  const { tooltipState, showTooltip, hideTooltip } = useWeatherTooltip()
  const [currentTimeTop, setCurrentTimeTop] = useState<number>(0)
  const timelineRef = useRef<HTMLDivElement>(null)

  const today = new Date()
  const isToday = isSameDay(currentDate, today)
  const allDayEvents = events.filter((e) => isSameDay(new Date(e.start), currentDate) && e.all_day)
  const timedEvents = getTimedEvents(events, currentDate)
  const dayWeather = getWeatherForDate(weatherForecast, currentDate)

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
        {/* Sticky pinned area: weather + all-day events */}
        {(dayWeather || allDayEvents.length > 0) && (
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: zIndices.stickyArea + 1,
              background: colors.bg,
              marginBottom: `${spacing.md}px`,
            }}
          >
            {/* Weather section - single row */}
            {dayWeather && (
              <div
                style={{
                  borderBottom:
                    allDayEvents.length > 0
                      ? `1px solid ${colors.borderLight}`
                      : `1px solid ${colors.border}`,
                  padding: `${spacing.sm}px ${spacing.xl}px`,
                }}
              >
                <div
                  onMouseEnter={(e) => showTooltip(dayWeather, e.clientX, e.clientY)}
                  onMouseLeave={hideTooltip}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: spacing.md,
                    cursor: 'pointer',
                    padding: `${spacing.xs}px ${spacing.sm}px`,
                    borderRadius: `${radii.lg}px`,
                    transition: 'background 0.15s',
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.background = colors.bgHover
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <WeatherIcon condition={dayWeather.icon} size="medium" />
                  <span style={{ fontSize: '18px', fontWeight: 600, color: colors.textPrimary }}>
                    {Math.round(dayWeather.high)}°
                  </span>
                  <span style={{ fontSize: '14px', color: colors.textMuted }}>
                    {Math.round(dayWeather.low)}°
                  </span>
                  <span style={{ fontSize: '13px', color: colors.textSecondary }}>
                    {dayWeather.condition}
                  </span>
                  {dayWeather.humidity != null && (
                    <span
                      style={{
                        fontSize: '12px',
                        color: colors.textMuted,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
                          fill="#60A5FA"
                          opacity="0.85"
                        />
                      </svg>
                      {dayWeather.humidity}%
                    </span>
                  )}
                  {dayWeather.wind_speed != null && (
                    <span
                      style={{
                        fontSize: '12px',
                        color: colors.textMuted,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px',
                      }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"
                          stroke="#94A3B8"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      {Math.round(dayWeather.wind_speed)} mph
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* All-day events section */}
            {allDayEvents.length > 0 && (
              <div
                style={{
                  padding: `${spacing.sm}px ${spacing.xl}px`,
                  borderTop: dayWeather ? 'none' : `1px solid ${colors.border}`,
                  borderBottom: `1px solid ${colors.border}`,
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
