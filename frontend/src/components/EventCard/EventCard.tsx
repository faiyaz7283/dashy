import type { CalendarEvent, FamilyMember } from '../../types'

interface EventCardProps {
  event: CalendarEvent
  members: FamilyMember[]
}

export function EventCard({ event, members }: EventCardProps) {
  const eventMembers = members.filter((m) => event.members.includes(m.key))
  const primaryMember = eventMembers[0]

  const startTime = new Date(event.start).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  const endTime = new Date(event.end).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const bgColor: Record<string, string> = {
    faiyaz: 'bg-blue-50',
    trisha: 'bg-pink-50',
    arya: 'bg-green-50',
    raya: 'bg-amber-50',
  }
  const borderColor: Record<string, string> = {
    faiyaz: 'border-faiyaz',
    trisha: 'border-trisha',
    arya: 'border-arya',
    raya: 'border-raya',
  }

  const bg = primaryMember ? bgColor[primaryMember.key] : 'bg-gray-50'
  const border = primaryMember ? borderColor[primaryMember.key] : 'border-gray-300'

  return (
    <div
      className={`rounded-lg p-3 ${bg} border-l-4 ${border} cursor-pointer transition-transform hover:scale-[1.01]`}
    >
      <div className="font-semibold text-sm text-gray-800">{event.title}</div>
      <div className="text-xs text-gray-500 mt-0.5">
        {event.all_day ? 'All day' : `${startTime} – ${endTime}`}
      </div>
      {eventMembers.length > 0 && (
        <div className="flex gap-1 mt-2">
          {eventMembers.map((m) => (
            <span
              key={m.key}
              className="w-[22px] h-[22px] rounded-full flex items-center justify-center text-[11px] font-semibold text-white"
              style={{ backgroundColor: m.color }}
            >
              {m.initial}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
