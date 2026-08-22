/**
 * Month view — traditional calendar grid.
 *
 * Displays a 7-column grid (Mon-Sun) with:
 * - Day-of-week headers
 * - 6 weeks of day cells
 * - Each cell shows date number and event count badge
 * - Density-colored week indicators on the left
 *
 * Events are shown as small cards within each day cell.
 */

import { useCalendarData } from '../hooks/useCalendarData'
import { ContentCard } from '@/shared/components/ContentCard'
import { NavArrows } from '@/shared/components/NavArrows'
import { getMonthGridDates } from '@/shared/date/calendar'
import { getEventsForDate } from '@/shared/utils/calendar'
import { getRelativeDensity, getEventCountsByDay } from '@/shared/utils/density'
import { memberBgClasses, memberBgOpacityClasses, memberBgHoverClasses, getMemberInitial, type MemberColorKey } from '@/shared/utils/memberColors'
import type { CalendarEvent } from '@/types/calendar'

/** Props for the MonthView component. */
export interface MonthViewProps {
  /** The date within the month to display. */
  date: Temporal.PlainDate
  /** Callback for previous navigation. */
  onPrevious: () => void
  /** Callback for next navigation. */
  onNext: () => void
}

/**
 * Month view showing a traditional calendar grid.
 *
 * @param props - Date and navigation callbacks.
 * @returns The month view UI.
 */
export function MonthView({ date, onPrevious, onNext }: MonthViewProps) {
  const { events, isLoading } = useCalendarData()
  const yearMonth = Temporal.PlainYearMonth.from(date)
  const gridDates = getMonthGridDates(yearMonth)

  // Group dates into weeks (7 days each)
  const weeks = Array.from({ length: 6 }, (_, i) => gridDates.slice(i * 7, (i + 1) * 7))

  // Calculate event counts per day for density
  const eventCounts = getEventCountsByDay(events)
  const allCounts = Object.values(eventCounts)

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
        previousTitle="Previous month"
        nextTitle="Next month"
      />
      <ContentCard>
        <div className="flex flex-1 flex-col overflow-hidden p-4">
          {/* Day-of-week headers */}
          <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-0 border-b border-border">
            <div className="w-2" />
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div
                key={day}
                className="py-1 text-center text-xs font-semibold uppercase tracking-wide text-text-muted"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Week rows */}
          <div className="flex-1 grid grid-rows-6 gap-0 border-t border-border">
            {weeks.map((week, weekIdx) => {
              // Calculate week density
              const weekCount = week.reduce((sum, d) => sum + (eventCounts[d.toString()] || 0), 0)
              const weekDensity = getRelativeDensity(weekCount, allCounts)

              const densityBorderClasses = {
                none: 'border-l-density-none',
                low: 'border-l-density-low',
                medium: 'border-l-density-medium',
                high: 'border-l-density-high',
              } as const

              return (
                <div key={weekIdx} className="grid grid-cols-[auto_repeat(7,1fr)] gap-0">
                  {/* Density indicator */}
                  <div
                    className={`w-2 rounded-l-sm border-l-4 ${densityBorderClasses[weekDensity]}`}
                  />

                  {/* Day cells */}
                  {week.map((dayDate) => (
                    <DayCell
                      key={dayDate.toString()}
                      date={dayDate}
                      isCurrentMonth={dayDate.month === date.month}
                      events={events}
                      eventCount={eventCounts[dayDate.toString()] || 0}
                    />
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </ContentCard>
    </>
  )
}

/** Props for a day cell. */
interface DayCellProps {
  /** The date for this cell. */
  date: Temporal.PlainDate
  /** Whether this date is in the current month. */
  isCurrentMonth: boolean
  /** All calendar events. */
  events: CalendarEvent[]
  /** Event count for this day. */
  eventCount: number
}

/**
 * Single day cell in the month grid.
 *
 * Shows date number, event count badge, and up to 2 event cards.
 */
function DayCell({ date, isCurrentMonth, events, eventCount }: DayCellProps) {
  const dayEvents = getEventsForDate(events, date).slice(0, 2) // Show max 2 events
  const textColor = isCurrentMonth ? 'text-text-primary' : 'text-text-disabled'

  const densityBgClasses = {
    none: 'bg-density-none',
    low: 'bg-density-low',
    medium: 'bg-density-medium',
    high: 'bg-density-high',
  } as const

  // Calculate density for this day
  const density = eventCount === 0 ? 'none' : eventCount <= 2 ? 'low' : eventCount <= 5 ? 'medium' : 'high'

  return (
    <div className="cursor-pointer border-b border-r border-border p-1.5 transition-colors hover:bg-bg-hover">
      {/* Date number and event count */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1">
        <span className={`text-xs font-medium ${textColor}`}>{date.day}</span>
        <div />
        {eventCount > 0 && (
          <span
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium text-text-primary ${densityBgClasses[density]}`}
          >
            {eventCount}
          </span>
        )}
      </div>

      {/* Event cards */}
      {dayEvents.length > 0 && (
        <div className="mt-1 space-y-0.5">
          {dayEvents.map((event) => {
            const memberColor = (event.members[0] ?? 'faiyaz') as MemberColorKey

            return (
              <div
                key={event.id}
                className={`cursor-pointer rounded-sm border-l-2 ${memberBgOpacityClasses[memberColor]} px-1 py-0.5 transition-colors ${memberBgHoverClasses[memberColor]}`}
                style={{ borderLeftColor: `var(--dt-member-${memberColor})` }}
              >
                <div className="flex items-center justify-between">
                  <span className="truncate text-[9px] font-medium text-text-primary">
                    {event.title}
                  </span>
                  <div
                    className={`ml-1 flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-full ${memberBgClasses[memberColor]} text-[7px] font-bold leading-none text-white`}
                  >
                    {getMemberInitial(memberColor)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
