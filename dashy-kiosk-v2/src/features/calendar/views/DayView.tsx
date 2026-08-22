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

import { useCalendarData } from '../hooks/useCalendarData'
import { ContentCard } from '@/shared/components/ContentCard'
import { NavArrows } from '@/shared/components/NavArrows'
import { getEventsForDate, getTimedEventsForDate, getAllDayEventsForDate } from '@/shared/utils/calendar'
import { formatTime } from '@/shared/date/format'
import { isTimedEvent } from '@/types/calendar'
import { layout } from '@/theme/tokens'
import { memberBgClasses, memberBgOpacityClasses, memberBgHoverClasses, getMemberInitial, type MemberColorKey } from '@/shared/utils/memberColors'
import type { CalendarEvent, TimedCalendarEvent } from '@/types/calendar'

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

  const dayEvents = getEventsForDate(events, date)
  const allDayEvents = getAllDayEventsForDate(dayEvents, date)
  const timedEvents = getTimedEventsForDate(dayEvents, date)

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
    <>
      <NavArrows
        onPrevious={onPrevious}
        onNext={onNext}
        previousTitle="Previous day"
        nextTitle="Next day"
      />
      <ContentCard>
        {/* Weather bar (placeholder) */}
        <div className="border-b border-border px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full bg-warning" />
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-text-primary">83°</span>
              <span className="text-sm text-text-muted">68°</span>
            </div>
            <span className="text-sm text-text-muted">clear</span>
          </div>
        </div>

        {/* All-day events */}
        {allDayEvents.length > 0 && (
          <div className="border-b border-border px-4 py-2">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
              All-day
            </div>
            <div className="space-y-1">
              {allDayEvents.map((event) => (
                <EventCard key={event.id} event={event} />
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
                  style={{ height: layout.timelineHourHeight }}
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
                  style={{ height: layout.timelineHourHeight }}
                />
              ))}

              {/* Timed events */}
              {timedEvents.filter(isTimedEvent).map((event) => (
                <TimedEventBlock key={event.id} event={event} />
              ))}
            </div>
          </div>
        </div>
      </ContentCard>
    </>
  )
}

/**
 * Event card for all-day events.
 *
 * Follows the canonical pattern: colored left border, light background, member icon on right.
 */
function EventCard({ event }: { event: CalendarEvent }) {
  const memberColor = (event.members[0] ?? 'faiyaz') as MemberColorKey

  return (
    <div
      className={`cursor-pointer rounded-md border-l-4 ${memberBgOpacityClasses[memberColor]} px-3 py-1.5 transition-colors ${memberBgHoverClasses[memberColor]}`}
      style={{ borderLeftColor: `var(--dt-member-${memberColor})` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-primary">{event.title}</span>
        <div
          className={`flex h-5 w-5 items-center justify-center rounded-full ${memberBgClasses[memberColor]} text-[10px] font-bold leading-none text-white`}
        >
          {getMemberInitial(memberColor)}
        </div>
      </div>
    </div>
  )
}

/**
 * Timed event block positioned in the time grid.
 *
 * Calculates position based on start/end time and renders as an absolutely positioned card.
 */
function TimedEventBlock({ event }: { event: TimedCalendarEvent }) {
  const startHour = event.start.hour + event.start.minute / 60
  const endHour = event.end.hour + event.end.minute / 60
  const duration = endHour - startHour

  const top = startHour * layout.timelineHourHeight
  const height = duration * layout.timelineHourHeight

  const memberColor = (event.members[0] ?? 'faiyaz') as MemberColorKey

  return (
    <div
      className={`absolute left-1 right-1 cursor-pointer rounded-md border-l-4 ${memberBgOpacityClasses[memberColor]} px-2 py-1 transition-colors ${memberBgHoverClasses[memberColor]}`}
      style={{
        top,
        height,
        borderLeftColor: `var(--dt-member-${memberColor})`,
      }}
    >
      <div className="flex h-full flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-text-primary truncate">{event.title}</span>
          <div
            className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full ${memberBgClasses[memberColor]} ml-1 text-[8px] font-bold leading-none text-white`}
          >
            {getMemberInitial(memberColor)}
          </div>
        </div>
        <div className="text-[10px] text-text-muted">
          {formatTime(event.start.toPlainTime())} – {formatTime(event.end.toPlainTime())}
        </div>
      </div>
    </div>
  )
}
