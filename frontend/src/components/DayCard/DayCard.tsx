import type { CalendarEvent, FamilyMember } from '../../types'
import { EventCard } from '../EventCard'

interface DayCardProps {
  date: Date
  events: CalendarEvent[]
  members: FamilyMember[]
  isToday: boolean
  isNextWeek?: boolean
}

export function DayCard({ date, events, members, isToday, isNextWeek }: DayCardProps) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
  const dayNum = date.getDate()

  return (
    <div
      className={`rounded-xl border p-4 ${
        isNextWeek ? 'border-dashed border-gray-300 opacity-70' : 'border-gray-200'
      } bg-white`}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-lg font-bold text-gray-800">
            {isNextWeek ? 'Next week' : `${dayName} `}
            {!isNextWeek &&
              (isToday ? (
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white text-sm font-bold ml-1">
                  {dayNum}
                </span>
              ) : (
                <span className="ml-1">{dayNum}</span>
              ))}
          </h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {isNextWeek ? 'Aug 11 – 17' : `${events.length} event${events.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {!isNextWeek && (
          <button className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">
            + Add
          </button>
        )}
      </div>
      <div className="space-y-2">
        {events.map((event) => (
          <EventCard key={event.id} event={event} members={members} />
        ))}
      </div>
    </div>
  )
}
