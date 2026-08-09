import type { CalendarEvent, FamilyMember } from '../../types'
import { DayCard } from '../DayCard'
import { spacing } from '../../theme/tokens'
import { themeConfig } from '../../theme/config'
import { getWeekDays, isSameDay } from '../../utils/dateFormat'
import { getRelativeDensity } from '../../utils/density'

interface WeekGridProps {
  events: CalendarEvent[]
  members: FamilyMember[]
  orientation: 'landscape' | 'portrait'
  /** The current date for the week view (used for navigation). */
  currentDate: Date
  /** Callback when a day card is clicked. */
  onDayClick?: (date: Date) => void
}

function getEventsForDay(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter((e) => {
    const eventDate = new Date(e.start)
    return isSameDay(eventDate, date)
  })
}

export function WeekGrid({ events, members, orientation, currentDate, onDayClick }: WeekGridProps) {
  const today = new Date()
  const weekDays = getWeekDays(currentDate)
  const nextWeekStart = new Date(weekDays[6])
  nextWeekStart.setDate(nextWeekStart.getDate() + 1)
  const nextWeekEnd = new Date(nextWeekStart)
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 6)

  const cols =
    orientation === 'landscape'
      ? themeConfig.calendar.weekGridLandscape
      : themeConfig.calendar.weekGridPortrait

  // Calculate event counts for each day to determine density
  const dayCounts = weekDays.map((date) => getEventsForDay(events, date).length)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: `${spacing.lg}px`,
      }}
    >
      {weekDays.map((date, idx) => (
        <DayCard
          key={date.toISOString()}
          date={date}
          events={getEventsForDay(events, date)}
          members={members}
          isToday={isSameDay(date, today)}
          density={getRelativeDensity(dayCounts[idx], dayCounts)}
          onClick={onDayClick ? () => onDayClick(date) : undefined}
        />
      ))}
      <DayCard
        date={nextWeekStart}
        nextWeekEnd={nextWeekEnd}
        events={[]}
        members={members}
        isToday={false}
        isNextWeek
      />
    </div>
  )
}
