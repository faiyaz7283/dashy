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
import { getMonthGridDates, formatRelativeDay } from '@/shared/date/calendar'
import { getEventsForDate } from '@/shared/utils/calendar'
import { getRelativeDensity, getEventCountsByDay } from '@/shared/utils/density'
import { buildMemberColorMap } from '@/shared/utils/memberColors'
import type { CalendarEvent } from '@/types/calendar'
import type { FamilyMember } from '@/types/family'
import type { PaletteKey } from '@/shared/utils/memberColors'
import type { DailyForecast } from '@/types/weather'

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
  const { forecast } = useWeatherData()
  const { members } = useFamilyData()
  const colorMap = useMemo(() => buildMemberColorMap(members), [members])
  const { hoveredEvent, popupRef, EventPopupProvider } = useEventPopup()
  const yearMonth = Temporal.PlainYearMonth.from(date)
  const gridDates = getMonthGridDates(yearMonth)
  const today = Temporal.Now.plainDateISO()
  const forecastByDate = useForecastMap(forecast)

  // Group dates into weeks (7 days each)
  const weeks = useMemo(() => Array.from({ length: 6 }, (_, i) => gridDates.slice(i * 7, (i + 1) * 7)), [gridDates])

  // Calculate event counts per day for density
  const eventCounts = useMemo(() => getEventCountsByDay(events), [events])
  const allCounts = useMemo(() => Object.values(eventCounts), [eventCounts])

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
                  {week.map((dayDate) => {
                    const isToday = Temporal.PlainDate.compare(dayDate, today) === 0
                    const dayForecast = forecastByDate.get(dayDate.toString())
                    return (
                      <DayCell
                        key={dayDate.toString()}
                        date={dayDate}
                        isCurrentMonth={dayDate.month === date.month}
                        isToday={isToday}
                        events={events}
                        eventCount={eventCounts[dayDate.toString()] || 0}
                        colorMap={colorMap}
                        members={members}
                        forecast={dayForecast}
                      />
                    )
                  })}
                </div>
              )
            })}
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

/** Props for a day cell. */
interface DayCellProps {
  /** The date for this cell. */
  date: Temporal.PlainDate
  /** Whether this date is in the current month. */
  isCurrentMonth: boolean
  /** Whether this date is today. */
  isToday: boolean
  /** All calendar events. */
  events: CalendarEvent[]
  /** Event count for this day. */
  eventCount: number
  /** Member color map. */
  colorMap: Map<string, PaletteKey>
  /** Family members. */
  members: FamilyMember[]
  /** Weather forecast for this day (optional). */
  forecast?: DailyForecast | undefined
}

/**
 * Single day cell in the month grid.
 *
 * Shows date number, event count badge, and up to 2 event cards.
 */
function DayCell({ date, isCurrentMonth, isToday, events, eventCount, colorMap, members, forecast }: DayCellProps) {
  const dayEvents = getEventsForDate(events, date).slice(0, 2) // Show max 2 events
  const textColor = isCurrentMonth ? 'text-text-primary' : 'text-text-disabled'
  const { dayLabel, dateLabel } = formatRelativeDay(date)

  const densityBgClasses = {
    none: 'bg-density-none',
    low: 'bg-density-low',
    medium: 'bg-density-medium',
    high: 'bg-density-high',
  } as const

  // Calculate density for this day
  const density = eventCount === 0 ? 'none' : eventCount <= 2 ? 'low' : eventCount <= 5 ? 'medium' : 'high'

  return (
    <div className={`cursor-pointer border-b border-r border-border p-1.5 transition-colors hover:bg-bg-hover ${isToday ? 'ring-2 ring-primary' : ''}`}>
      {/* Date number and event count */}
      <div className="grid grid-cols-[auto_1fr_auto] items-center gap-1">
        {isToday ? (
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-[10px] font-bold leading-none">
            {date.day}
          </span>
        ) : (
          <span className={`text-xs font-medium ${textColor}`}>{date.day}</span>
        )}
        {forecast && (
          <div className="flex justify-center">
            <DayWeatherBadge forecast={forecast} isToday={isToday} dateLabel={dayLabel} dateSublabel={dateLabel} />
          </div>
        )}
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
          {dayEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              colorMap={colorMap}
              members={members}
              size="sm"
            />
          ))}
        </div>
      )}
    </div>
  )
}
