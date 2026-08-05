import type { FamilyMember, CalendarEvent } from '../../types'

interface FamilyPillsProps {
  members: FamilyMember[]
  events: CalendarEvent[]
}

export function FamilyPills({ members, events }: FamilyPillsProps) {
  const bgColors: Record<string, string> = {
    faiyaz: 'bg-blue-50 border-blue-200',
    trisha: 'bg-pink-50 border-pink-200',
    arya: 'bg-green-50 border-green-200',
    raya: 'bg-amber-50 border-amber-200',
  }
  const textColors: Record<string, string> = {
    faiyaz: 'text-blue-700',
    trisha: 'text-pink-700',
    arya: 'text-green-700',
    raya: 'text-amber-700',
  }
  const countColors: Record<string, string> = {
    faiyaz: 'text-blue-400',
    trisha: 'text-pink-400',
    arya: 'text-green-400',
    raya: 'text-amber-400',
  }

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-2.5 flex items-center gap-2.5 overflow-x-auto">
      {members.map((m) => {
        const eventCount = events.filter((e) => e.members.includes(m.key)).length
        return (
          <div
            key={m.key}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border shrink-0 ${bgColors[m.key]}`}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
              style={{ backgroundColor: m.color }}
            >
              {m.initial}
            </span>
            <span className={`text-sm font-medium ${textColors[m.key]}`}>{m.name}</span>
            <span className={`text-xs ${countColors[m.key]}`}>{eventCount} events</span>
          </div>
        )
      })}
    </div>
  )
}
