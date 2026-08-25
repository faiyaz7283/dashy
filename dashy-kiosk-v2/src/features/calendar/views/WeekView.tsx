/**
 * Week view — 4×2 grid of day cards with density indicators.
 *
 * Displays an 8-cell grid (4 columns × 2 rows):
 * - Cells 1–7: Day cards (Mon–Sun) with density-colored top borders
 * - Cell 8: Next week preview card showing upcoming events
 *
 * Each day card shows:
 * - Density-colored top border
 * - Day header (weekday + date)
 * - Event count badge
 * - List of timed events for that day
 */

import { useMemo } from 'react'
import { useCalendarData } from '../hooks/useCalendarData'
import { useWeatherData } from '@/features/weather/hooks/useWeatherData'
import { useForecastMap } from '@/features/weather/hooks/useForecastMap'
import { useFamilyData } from '@/shared/hooks/useFamilyData'
import { ContentCard } from '@/shared/components/ContentCard'
import { NavArrows } from '@/shared/components/NavArrows'
import { EventPopup } from '../components/EventPopup'
import { EventCard } from '../components/EventCard'
import { DayWeatherBadge } from '../components/DayWeatherBadge'
import { useEventPopup } from '../hooks/useEventPopup'
import { getWeekDays, getShortWeekday, formatRelativeDay } from '@/shared/date/calendar'
import { getEventsForDate, getTimedEventsForDate } from '@/shared/utils/calendar'
import { getEventCountsByDay, getRelativeDensity } from '@/shared/utils/density'
import { isTimedEvent } from '@/types/calendar'
import { buildMemberColorMap } from '@/shared/utils/memberColors'
import type { CalendarEvent } from '@/types/calendar'
import type { FamilyMember } from '@/types/family'
import type { PaletteKey } from '@/shared/utils/memberColors'
import type { DailyForecast } from '@/types/weather'

/** Props for the WeekView component. */
export interface WeekViewProps {
  /** The date within the week to display. */
  date: Temporal.PlainDate
  /** Callback for previous navigation. */
  onPrevious: () => void
  /** Callback for next navigation. */
  onNext: () => void
}

/**
 * Week view showing days in a 4×2 grid with density indicators.
 *
 * @param props - Date and navigation callbacks.
 * @returns The week view UI.
 */
export function WeekView({ date, onPrevious, onNext }: WeekViewProps) {
  const { events, isLoading } = useCalendarData()
  const { forecast } = useWeatherData()
  const { members } = useFamilyData()
  const colorMap = useMemo(() => buildMemberColorMap(members), [members])
  const { hoveredEvent, popupRef, EventPopupProvider } = useEventPopup()
  const weekDays = getWeekDays(date)
  const today = Temporal.Now.plainDateISO()
  const forecastByDate = useForecastMap(forecast)

  // Calculate event counts per day for density
  const dayCounts = useMemo(() => getEventCountsByDay(events ?? []), [events])
  const allCounts = useMemo(() => Object.values(dayCounts), [dayCounts])

  // Compute next week's date range
  const sunday = weekDays[6]
  const nextWeekMonday = sunday?.add({ days: 1 })
  const nextWeekSunday = nextWeekMonday?.add({ days: 6 })
  const nextWeekEvents = useMemo(() => {
    if (!events || !nextWeekMonday || !nextWeekSunday) return []
    return events.filter((event) => {
      const eventDate = event.start instanceof Temporal.PlainDate
        ? event.start
        : event.start.toPlainDate()
      return (
        Temporal.PlainDate.compare(eventDate, nextWeekMonday) >= 0 &&
        Temporal.PlainDate.compare(eventDate, nextWeekSunday) <= 0
      )
    })
  }, [events, nextWeekMonday, nextWeekSunday])

  if (isLoading || !events) {
    return (
      <ContentCard>
        <div className="flex h-full items-center justify-center">
          <p className="text-text-muted">Loading calendar...</p>
        </div>
      </ContentCard>
    )
  }

  if (!sunday || !nextWeekMonday || !nextWeekSunday) return null

  return (
    <EventPopupProvider>
      <NavArrows
        onPrevious={onPrevious}
        onNext={onNext}
        previousTitle="Previous week"
        nextTitle="Next week"
      />
      <ContentCard>
        <div className="grid h-full grid-cols-4 grid-rows-2 gap-3 overflow-hidden p-4">
          {weekDays.map((day) => {
            const dayKey = day.toString()
            const dayCount = dayCounts[dayKey] || 0
            const density = getRelativeDensity(dayCount, allCounts)
            const isToday = Temporal.PlainDate.compare(day, today) === 0
            const dayForecast = forecastByDate.get(dayKey)

            return (
              <DayCard key={dayKey} date={day} events={events} density={density} colorMap={colorMap} members={members} isToday={isToday} forecast={dayForecast} />
            )
          })}
          <NextWeekCard
            startDate={nextWeekMonday}
            endDate={nextWeekSunday}
            events={nextWeekEvents}
            colorMap={colorMap}
            members={members}
          />
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
 * Single day card in the week view grid.
 *
 * Shows density-colored top border, day header, event count, and list of timed events.
 */
interface DayCardProps {
  /** The date for this card. */
  date: Temporal.PlainDate
  /** All calendar events. */
  events: CalendarEvent[]
  /** Density level for this day. */
  density: 'none' | 'low' | 'medium' | 'high'
  /** Member color map. */
  colorMap: Map<string, PaletteKey>
  /** Family members. */
  members: FamilyMember[]
  /** Whether this is today's date. */
  isToday: boolean
  /** Weather forecast for this day (optional). */
  forecast?: DailyForecast | undefined
}

function DayCard({ date, events, density, colorMap, members, isToday, forecast }: DayCardProps) {
  const dayEvents = getEventsForDate(events, date)
  const timedEvents = getTimedEventsForDate(dayEvents, date).filter(isTimedEvent)
  const weekday = getShortWeekday(date)
  const dayNum = date.day
  const { dayLabel, dateLabel } = formatRelativeDay(date)

  const densityBorderClasses = {
    none: 'border-t-density-none',
    low: 'border-t-density-low',
    medium: 'border-t-density-medium',
    high: 'border-t-density-high',
  } as const

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg bg-white ring-1 ring-border dark:bg-bg border-t-4 ${densityBorderClasses[density]} ${isToday ? 'ring-2 ring-primary' : ''}`}
    >
      {/* Day header */}
      <div className="flex items-center justify-between px-3 pb-2 pt-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-text-primary">{weekday}</span>
          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${isToday ? 'bg-primary text-white' : 'text-text-primary'}`}>
            {dayNum}
          </span>
        </div>
        {forecast && <DayWeatherBadge forecast={forecast} isToday={isToday} dateLabel={dayLabel} dateSublabel={dateLabel} />}
        <span className="inline-flex items-center rounded-full bg-bg-hover px-2 py-0.5 text-xs font-medium text-text-muted ring-1 ring-border">
          {timedEvents.length} events
        </span>
      </div>

      {/* Events list */}
      <div className="flex-1 space-y-1.5 overflow-y-auto scrollbar-hide px-3 pb-3">
        {timedEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            colorMap={colorMap}
            members={members}
            size="md"
            showTime={true}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Next week preview card showing upcoming events.
 *
 * Displays a date range header (e.g., "Aug 24 – 30"), event count, and list of events.
 * No density border — visually consistent with day cards but distinguished by date range header.
 */
interface NextWeekCardProps {
  /** Monday of next week. */
  startDate: Temporal.PlainDate
  /** Sunday of next week. */
  endDate: Temporal.PlainDate
  /** Events occurring next week. */
  events: CalendarEvent[]
  /** Member color map. */
  colorMap: Map<string, PaletteKey>
  /** Family members. */
  members: FamilyMember[]
}

function NextWeekCard({ startDate, endDate, events, colorMap, members }: NextWeekCardProps) {
  const locale = 'en-US-u-ca-iso8601'
  const startMonth = startDate.toLocaleString(locale, { month: 'short' })
  const endMonth = endDate.toLocaleString(locale, { month: 'short' })
  const dateRange =
    startMonth === endMonth
      ? `${startMonth} ${startDate.day} – ${endDate.day}`
      : `${startMonth} ${startDate.day} – ${endMonth} ${endDate.day}`

  const timedEvents = events
    .filter((e) => e.start instanceof Temporal.PlainDateTime)
    .filter(isTimedEvent)

  return (
    <div className="flex flex-col overflow-hidden rounded-lg bg-white ring-1 ring-border dark:bg-bg">
      {/* Date range header */}
      <div className="flex items-center justify-between px-3 pb-2 pt-3">
        <span className="text-base font-semibold text-text-muted">{dateRange}</span>
        <span className="inline-flex items-center rounded-full bg-bg-hover px-2 py-0.5 text-xs font-medium text-text-muted ring-1 ring-border">
          {events.length} events
        </span>
      </div>

      {/* Events list */}
      <div className="flex-1 space-y-1.5 overflow-y-auto scrollbar-hide px-3 pb-3">
        {timedEvents.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            colorMap={colorMap}
            members={members}
            size="md"
            showTime={true}
          />
        ))}
      </div>
    </div>
  )
}

