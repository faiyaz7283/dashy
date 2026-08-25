/**
 * Year view — 12-month grid of mini calendars.
 *
 * Displays a 4×3 grid of months, each showing:
 * - Month name and event count badge
 * - Day-of-week headers (M T W T F S S)
 * - Mini calendar grid with day numbers
 * - Density-colored indicators for days with events
 *
 * Each month is clickable to navigate to month view.
 */

import { useMemo } from 'react'
import { useCalendarData } from '../hooks/useCalendarData'
import { useFamilyData } from '@/shared/hooks/useFamilyData'
import { ContentCard } from '@/shared/components/ContentCard'
import { NavArrows } from '@/shared/components/NavArrows'
import { getMonthGridDates } from '@/shared/date/calendar'
import { getEventCountsByMonth, getRelativeDensity } from '@/shared/utils/density'
import { buildMemberColorMap, paletteBorderTopClasses, getMemberPaletteKey } from '@/shared/utils/memberColors'
import type { PaletteKey } from '@/shared/utils/memberColors'

/** Props for the YearView component. */
export interface YearViewProps {
  /** The date within the year to display. */
  date: Temporal.PlainDate
  /** Callback for previous navigation. */
  onPrevious: () => void
  /** Callback for next navigation. */
  onNext: () => void
}

/**
 * Year view showing 12 months in a grid.
 *
 * @param props - Date and navigation callbacks.
 * @returns The year view UI.
 */
export function YearView({ date, onPrevious, onNext }: YearViewProps) {
  const { events, isLoading } = useCalendarData()
  const { members } = useFamilyData()
  const colorMap = useMemo(() => buildMemberColorMap(members), [members])
  const year = date.year
  const today = Temporal.Now.plainDateISO()

  // Calculate event counts per month for density
  const monthCounts = useMemo(() => getEventCountsByMonth(events), [events])
  const allCounts = useMemo(() => Object.values(monthCounts), [monthCounts])

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
        previousTitle="Previous year"
        nextTitle="Next year"
      />
      <ContentCard>
        <div className="grid h-full grid-cols-4 grid-rows-3 gap-3 overflow-hidden p-4">
          {Array.from({ length: 12 }, (_, monthIdx) => {
            const month = monthIdx + 1
            const monthStr = `${year}-${String(month).padStart(2, '0')}`
            const yearMonth = Temporal.PlainYearMonth.from(monthStr)
            const monthKey = monthStr
            const monthCount = monthCounts[monthKey] || 0
            const monthDensity = getRelativeDensity(monthCount, allCounts)

            return (
              <MiniMonth
                key={monthKey}
                yearMonth={yearMonth}
                events={events}
                eventCount={monthCount}
                density={monthDensity}
                colorMap={colorMap}
                today={today}
              />
            )
          })}
        </div>
      </ContentCard>
    </>
  )
}

/** Props for a mini month calendar. */
interface MiniMonthProps {
  /** The year-month to display. */
  yearMonth: Temporal.PlainYearMonth
  /** All calendar events. */
  events: import('@/types/calendar').CalendarEvent[]
  /** Event count for this month. */
  eventCount: number
  /** Density level for this month. */
  density: 'none' | 'low' | 'medium' | 'high'
  /** Member color map. */
  colorMap: Map<string, PaletteKey>
  /** Today's date for highlighting. */
  today: Temporal.PlainDate
}

/**
 * Mini month calendar in the year view.
 *
 * Shows month name, event count badge, and a small calendar grid with
 * member-colored triangle indicators for days with events.
 */
function MiniMonth({ yearMonth, events, eventCount, density, colorMap, today }: MiniMonthProps) {
  const gridDates = getMonthGridDates(yearMonth, 5) // 5 rows for compact view
  const monthName = yearMonth.toLocaleString('en-US-u-ca-iso8601', { month: 'long' })

  const densityBgClasses = {
    none: 'bg-density-none',
    low: 'bg-density-low',
    medium: 'bg-density-medium',
    high: 'bg-density-high',
  } as const

  // Track which palette colors have events on each day
  const dayMembers = new Map<string, PaletteKey[]>()
  for (const event of events) {
    const eventDate = event.start instanceof Temporal.PlainDate ? event.start : event.start.toPlainDate()
    if (eventDate.year === yearMonth.year && eventDate.month === yearMonth.month) {
      const key = eventDate.toString()
      // Track the first member for the triangle indicator
      if (event.members.length > 0) {
        const memberKey = event.members[0]
        const paletteKey = getMemberPaletteKey(memberKey, colorMap)
        const existing = dayMembers.get(key) || []
        if (!existing.includes(paletteKey)) {
          existing.push(paletteKey)
        }
        dayMembers.set(key, existing)
      }
    }
  }

  const isCurrentMonth = today.year === yearMonth.year && today.month === yearMonth.month

  return (
    <section className={`flex flex-col overflow-hidden rounded-md p-2 ${isCurrentMonth ? 'ring-2 ring-primary' : ''}`}>
      {/* Month header */}
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary">{monthName}</h2>
        <span className={`rounded-full ${densityBgClasses[density]} px-2 py-0.5 text-[8px] font-medium text-text-primary`}>
          {eventCount}
        </span>
      </div>

      {/* Day-of-week headers */}
      <div className="mt-1 grid grid-cols-7 text-center text-[8px] font-medium text-text-muted">
        <div>M</div>
        <div>T</div>
        <div>W</div>
        <div>T</div>
        <div>F</div>
        <div>S</div>
        <div>S</div>
      </div>

      {/* Mini calendar grid */}
      <div className="isolate mt-1 grid flex-1 grid-cols-7 gap-px rounded-lg bg-border text-sm shadow-sm ring-1 ring-border">
        {gridDates.map((dayDate) => {
          const isCurrentMonth = dayDate.month === yearMonth.month
          const isToday = Temporal.PlainDate.compare(dayDate, today) === 0
          const dayKey = dayDate.toString()
          const textColor = isCurrentMonth ? 'text-text-primary' : 'text-text-disabled'
          const members = dayMembers.get(dayKey) || []

          return (
            <button
              key={dayKey}
              type="button"
              className={`relative bg-white py-0.5 ${textColor} first:rounded-tl-lg last:rounded-br-lg hover:bg-bg-hover focus:z-10 dark:bg-bg`}
            >
              {/* Member-colored triangle indicator for days with events */}
              {members.length > 0 && members[0] && (
                <div
                  className={`absolute top-0 left-0 w-0 h-0 border-t-[5px] border-r-[5px] border-r-transparent rounded-tl-md ${paletteBorderTopClasses[members[0]]}`}
                />
              )}
              <time
                dateTime={dayKey}
                className={`mx-auto flex items-center justify-center rounded-full ${isToday ? 'size-4 bg-primary text-white text-[9px] font-bold' : 'size-3.5'}`}
              >
                {dayDate.day}
              </time>
            </button>
          )
        })}
      </div>
    </section>
  )
}
