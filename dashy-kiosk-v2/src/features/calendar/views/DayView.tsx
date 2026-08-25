/**
 * Day view — single day timeline with hourly slots.
 *
 * Displays:
 * - Weather summary bar at top
 * - All-day events section
 * - 24-hour time grid with timed events positioned by start/end time
 * - Current time marker (red line)
 *
 * Events are rendered as colored cards with member avatar on the right.
 * Follows the canonical event card pattern from day view.
 */

import { useMemo } from 'react'
import { useCalendarData } from '../hooks/useCalendarData'
import { useWeatherData } from '@/features/weather/hooks/useWeatherData'
import { useForecastMap } from '@/features/weather/hooks/useForecastMap'
import { useWeatherPopup } from '@/features/weather/hooks/useWeatherPopup'
import { useFamilyData } from '@/shared/hooks/useFamilyData'
import { ContentCard } from '@/shared/components/ContentCard'
import { NavArrows } from '@/shared/components/NavArrows'
import { EventPopup } from '../components/EventPopup'
import { EventCard } from '../components/EventCard'
import { WeatherIcon } from '@/features/weather/components/WeatherIcon'
import { WeatherPopup } from '@/features/weather/components/WeatherPopup'
import { useEventPopup } from '../hooks/useEventPopup'
import { getEventsForDate, getTimedEventsForDate, getAllDayEventsForDate } from '@/shared/utils/calendar'
import { formatRelativeDay } from '@/shared/date/calendar'
import { isTimedEvent } from '@/types/calendar'
import { layout } from '@/theme/tokens'
import { buildMemberColorMap } from '@/shared/utils/memberColors'
import type { TimedCalendarEvent } from '@/types/calendar'
import type { FamilyMember } from '@/types/family'
import type { PaletteKey } from '@/shared/utils/memberColors'
import type { WeatherCondition } from '@/types/weather'

/** Props for the DayView component. */
export interface DayViewProps {
  /** The date to display. */
  date: Temporal.PlainDate
  /** Callback for previous navigation. */
  onPrevious: () => void
  /** Callback for next navigation. */
  onNext: () => void
}

/**
 * Day view showing a single day's timeline.
 *
 * @param props - Date and navigation callbacks.
 * @returns The day view UI.
 */
export function DayView({ date, onPrevious, onNext }: DayViewProps) {
  const { events, isLoading } = useCalendarData()
  const { forecast } = useWeatherData()
  const { members } = useFamilyData()
  const colorMap = useMemo(() => buildMemberColorMap(members), [members])
  const { hoveredEvent, popupRef, EventPopupProvider } = useEventPopup()
  const { popupRef: weatherPopupRef, handleMouseEnter: handleWeatherEnter, handleMouseMove: handleWeatherMove, handleMouseLeave: handleWeatherLeave } = useWeatherPopup()
  const forecastByDate = useForecastMap(forecast)

  const dayEvents = useMemo(() => getEventsForDate(events, date), [events, date])
  const allDayEvents = useMemo(() => getAllDayEventsForDate(dayEvents, date), [dayEvents, date])
  const timedEvents = useMemo(() => getTimedEventsForDate(dayEvents, date), [dayEvents, date])

  const dayKey = date.toString()
  const dayForecast = forecastByDate.get(dayKey)
  const { dayLabel, dateLabel } = formatRelativeDay(date)

  if (isLoading) {
    return (
      <ContentCard>
        <div className="flex h-full items-center justify-center">
          <p className="text-text-muted">Loading calendar...</p>
        </div>
      </ContentCard>
    )
  }

  return (
    <EventPopupProvider>
      <NavArrows
        onPrevious={onPrevious}
        onNext={onNext}
        previousTitle="Previous day"
        nextTitle="Next day"
      />
      <ContentCard>
        {/* Weather bar */}
        {dayForecast && (
          <>
            <div
              className="border-b border-border px-4 py-2 cursor-pointer"
              onMouseEnter={handleWeatherEnter}
              onMouseMove={handleWeatherMove}
              onMouseLeave={handleWeatherLeave}
            >
              <div className="flex items-center gap-3">
                <WeatherIcon condition={dayForecast.condition as WeatherCondition} size="md" className="text-warning" />
                <div className="flex items-baseline gap-2">
                  <span className="text-xl font-bold text-text-primary">{Math.round(dayForecast.high)}°</span>
                  <span className="text-sm text-text-muted">{Math.round(dayForecast.low)}°</span>
                </div>
                <span className="text-sm text-text-muted">{dayForecast.condition}</span>
              </div>
            </div>

            {/* Weather popup with fixed positioning */}
            <div
              ref={weatherPopupRef}
              className="fixed z-50 opacity-0 transition-opacity duration-100"
              style={{ left: -9999, top: -9999 }}
            >
              <WeatherPopup forecast={dayForecast} dateLabel={dayLabel} dateSublabel={dateLabel} />
            </div>
          </>
        )}

        {/* All-day events */}
        {allDayEvents.length > 0 && (
          <div className="border-b border-border px-4 py-2">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
              All-day
            </div>
            <div className="space-y-1">
              {allDayEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  colorMap={colorMap}
                  members={members}
                  size="lg"
                />
              ))}
            </div>
          </div>
        )}

        {/* Time grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex">
            {/* Time labels */}
            <div className="w-20 flex-shrink-0 border-r border-border">
              {Array.from({ length: 24 }, (_, hour) => (
                <div
                  key={hour}
                  className="flex items-start justify-end border-b border-border pr-3 pt-2 text-xs text-text-muted"
                  style={{ height: `${layout.timelineHourHeight}px` }}
                >
                  {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                </div>
              ))}
            </div>

            {/* Event column */}
            <div className="relative flex-1">
              {Array.from({ length: 24 }, (_, hour) => (
                <div
                  key={hour}
                  className="border-b border-border bg-white hover:bg-bg-hover dark:bg-bg"
                  style={{ height: `${layout.timelineHourHeight}px` }}
                />
              ))}

              {/* Timed events */}
              {timedEvents.filter(isTimedEvent).map((event) => (
                <TimedEventBlock
                  key={event.id}
                  event={event}
                  colorMap={colorMap}
                  members={members}
                />
              ))}
            </div>
          </div>
        </div>
      </ContentCard>

      {/* Event popup on hover — always mounted, positioned via DOM */}
      <div
        ref={popupRef}
        className="pointer-events-none fixed z-50 opacity-0 transition-opacity duration-100"
        style={{ left: -9999, top: -9999 }}
      >
        {hoveredEvent && <EventPopup event={hoveredEvent} />}
      </div>
    </EventPopupProvider>
  )
}

/**
 * Timed event block positioned in the time grid.
 *
 * Wraps the shared EventCard with absolute positioning based on start/end time.
 */
function TimedEventBlock({
  event,
  colorMap,
  members,
}: {
  event: TimedCalendarEvent
  colorMap: Map<string, PaletteKey>
  members: FamilyMember[]
}) {
  const startHour = event.start.hour + event.start.minute / 60
  const endHour = event.end.hour + event.end.minute / 60
  const duration = endHour - startHour

  const top = startHour * layout.timelineHourHeight
  const height = duration * layout.timelineHourHeight

  return (
    <div
      className="absolute left-1 right-1"
      style={{ top, height }}
    >
      <EventCard
        event={event}
        colorMap={colorMap}
        members={members}
        size="md"
        showTime={true}
      />
    </div>
  )
}
