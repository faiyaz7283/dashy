import type { CalendarEvent, FamilyMember } from '../../types'
import { DayCard } from '../DayCard'

interface WeekGridProps {
  events: CalendarEvent[]
  members: FamilyMember[]
  orientation: 'landscape' | 'portrait'
}

function getWeekDays(baseDate: Date): Date[] {
  const start = new Date(baseDate)
  const day = start.getDay()
  const diff = start.getDate() - day + (day === 0 ? -6 : 1) // Monday start
  start.setDate(diff)
  start.setHours(0, 0, 0, 0)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return d
  })
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function getEventsForDay(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter((e) => {
    const eventDate = new Date(e.start)
    return isSameDay(eventDate, date)
  })
}

export function WeekGrid({ events, members, orientation }: WeekGridProps) {
  const today = new Date()
  const weekDays = getWeekDays(today)
  const nextWeekStart = new Date(weekDays[6])
  nextWeekStart.setDate(nextWeekStart.getDate() + 1)

  const cols = orientation === 'landscape' ? 'grid-cols-4' : 'grid-cols-2'

  return (
    <div className={`grid ${cols} gap-4`}>
      {weekDays.map((date) => (
        <DayCard
          key={date.toISOString()}
          date={date}
          events={getEventsForDay(events, date)}
          members={members}
          isToday={isSameDay(date, today)}
        />
      ))}
      <DayCard
        date={nextWeekStart}
        events={events.filter((e) => new Date(e.start) >= nextWeekStart).slice(0, 2)}
        members={members}
        isToday={false}
        isNextWeek
      />
    </div>
  )
}
