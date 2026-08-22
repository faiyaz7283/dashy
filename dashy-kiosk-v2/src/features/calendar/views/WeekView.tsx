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

import { useCalendarData } from '../hooks/useCalendarData'
import { ContentCard } from '@/shared/components/ContentCard'
import { NavArrows } from '@/shared/components/NavArrows'
import { getWeekDays, getShortWeekday } from '@/shared/date/calendar'
import { getEventsForDate, getTimedEventsForDate } from '@/shared/utils/calendar'
import { getEventCountsByDay, getRelativeDensity } from '@/shared/utils/density'
import { formatTime } from '@/shared/date/format'
import { isTimedEvent } from '@/types/calendar'
import { memberBgClasses, memberBgOpacityClasses, memberBgHoverClasses, getMemberInitial, type MemberColorKey } from '@/shared/utils/memberColors'
import type { CalendarEvent, TimedCalendarEvent } from '@/types/calendar'

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
  const weekDays = getWeekDays(date)

  if (isLoading || !events) {
    return (
      <ContentCard>
        <div className="flex h-full items-center justify-center">
          <p className="text-text-muted">Loading calendar...</p>
        </div>
      </ContentCard>
    )
  }

  // Calculate event counts per day for density
  const dayCounts = getEventCountsByDay(events)
  const allCounts = Object.values(dayCounts)

  // Compute next week's date range
  const sunday = weekDays[6]
  if (!sunday) return null
  const nextWeekMonday = sunday.add({ days: 1 })
  const nextWeekSunday = nextWeekMonday.add({ days: 6 })
  const nextWeekEvents = events.filter((event) => {
    const eventDate = event.start instanceof Temporal.PlainDate
      ? event.start
      : event.start.toPlainDate()
    return (
      Temporal.PlainDate.compare(eventDate, nextWeekMonday) >= 0 &&
      Temporal.PlainDate.compare(eventDate, nextWeekSunday) <= 0
    )
  })

  return (
    <>
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

            return (
              <DayCard key={dayKey} date={day} events={events} density={density} />
            )
          })}
          <NextWeekCard
            startDate={nextWeekMonday}
            endDate={nextWeekSunday}
            events={nextWeekEvents}
          />
        </div>
      </ContentCard>
    </>
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
}

function DayCard({ date, events, density }: DayCardProps) {
  const dayEvents = getEventsForDate(events, date)
  const timedEvents = getTimedEventsForDate(dayEvents, date).filter(isTimedEvent)
  const weekday = getShortWeekday(date)
  const dayNum = date.day

  const densityBorderClasses = {
    none: 'border-t-density-none',
    low: 'border-t-density-low',
    medium: 'border-t-density-medium',
    high: 'border-t-density-high',
  } as const

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg bg-white ring-1 ring-border dark:bg-bg border-t-4 ${densityBorderClasses[density]}`}
    >
      {/* Day header */}
      <div className="flex items-center justify-between px-3 pb-2 pt-3">
        <div className="flex items-center gap-2">
          <span className="text-base font-semibold text-text-primary">{weekday}</span>
          <span className="text-base font-semibold text-text-primary">{dayNum}</span>
        </div>
        <span className="inline-flex items-center rounded-full bg-bg-hover px-2 py-0.5 text-xs font-medium text-text-muted ring-1 ring-border">
          {timedEvents.length} events
        </span>
      </div>

      {/* Events list */}
      <div className="flex-1 space-y-1.5 overflow-y-auto px-3 pb-3">
        {timedEvents.map((event) => (
          <EventCard key={event.id} event={event} />
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
}

function NextWeekCard({ startDate, endDate, events }: NextWeekCardProps) {
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
      <div className="flex-1 space-y-1.5 overflow-y-auto px-3 pb-3">
        {timedEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  )
}

/**
 * Event card for timed events in week view.
 *
 * Follows the canonical pattern: colored left border, light background, member icon on right.
 */
function EventCard({ event }: { event: TimedCalendarEvent }) {
  const memberColor = (event.members[0] ?? 'faiyaz') as MemberColorKey

  return (
    <div
      className={`cursor-pointer rounded-md border-l-4 ${memberBgOpacityClasses[memberColor]} px-2 py-1 transition-colors ${memberBgHoverClasses[memberColor]}`}
      style={{ borderLeftColor: `var(--dt-member-${memberColor})` }}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className="truncate text-xs font-medium text-text-primary">{event.title}</div>
          <div className="text-[10px] text-text-muted">
            {formatTime(event.start.toPlainTime())} – {formatTime(event.end.toPlainTime())}
          </div>
        </div>
        <div
          className={`ml-1 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full ${memberBgClasses[memberColor]} text-[8px] font-bold leading-none text-white`}
        >
          {getMemberInitial(memberColor)}
        </div>
      </div>
    </div>
  )
}
