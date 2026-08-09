import type { CalendarEvent, FamilyMember } from '../../types'
import { colors, radii, spacing, typography, memberColors } from '../../theme/tokens'

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

  const mc = primaryMember ? memberColors[primaryMember.key] : null
  const bg = mc ? mc.bg : colors.bgHover
  const borderLeft = mc ? mc.avatar : colors.borderDark

  return (
    <div
      style={{
        borderRadius: `${radii.lg}px`,
        padding: `${spacing.md}px`,
        background: bg,
        borderLeft: `3px solid ${borderLeft}`,
        cursor: 'pointer',
        transition: 'transform 0.15s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.01)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        {primaryMember && (
          <span
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              fontSize: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.white,
              fontWeight: 600,
              backgroundColor: primaryMember.color,
              flexShrink: 0,
            }}
          >
            {primaryMember.initial}
          </span>
        )}
        <span
          style={{
            fontWeight: typography.eventTitle.weight,
            fontSize: `${typography.eventTitle.size}px`,
            color: colors.textPrimary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {event.title}
        </span>
      </div>
      <div
        style={{
          fontSize: `${typography.eventTime.size}px`,
          color: colors.textMuted,
          marginTop: '2px',
        }}
      >
        {event.all_day ? 'All day' : `${startTime} – ${endTime}`}
      </div>
    </div>
  )
}
