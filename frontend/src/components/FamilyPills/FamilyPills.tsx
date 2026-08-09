import type { FamilyMember, CalendarEvent } from '../../types'
import { colors, spacing, radii, typography, memberColors } from '../../theme/tokens'

interface FamilyPillsProps {
  members: FamilyMember[]
  events: CalendarEvent[]
}

export function FamilyPills({ members, events }: FamilyPillsProps) {
  return (
    <div
      style={{
        background: colors.white,
        borderBottom: `1px solid ${colors.border}`,
        padding: `${spacing.sm + 2}px ${spacing.xl}px`,
        display: 'flex',
        alignItems: 'center',
        gap: `${spacing.sm}px`,
        overflowX: 'auto',
      }}
    >
      {members.map((m) => {
        const eventCount = events.filter((e) => e.members.includes(m.key)).length
        const memberColor = memberColors[m.key] || {
          bg: colors.bgHover,
          border: colors.border,
          text: colors.textMuted,
        }
        return (
          <div
            key={m.key}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: `${spacing.sm - 4}px`,
              padding: `${spacing.xs}px ${spacing.md}px`,
              borderRadius: `${radii.full}px`,
              border: `1px solid ${memberColor.border}`,
              background: memberColor.bg,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: `${typography.pillAvatar.size}px`,
                height: `${typography.pillAvatar.size}px`,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: `${typography.pillAvatar.fontSize}px`,
                fontWeight: typography.pillAvatar.weight,
                color: colors.white,
                backgroundColor: m.color,
              }}
            >
              {m.initial}
            </span>
            <span
              style={{
                fontSize: `${typography.pillText.size}px`,
                fontWeight: typography.pillText.weight,
                color: memberColor.text,
              }}
            >
              {m.name}
            </span>
            <span
              style={{
                fontSize: `${typography.pillCount.size}px`,
                fontWeight: typography.pillCount.weight,
                color: memberColor.text,
                opacity: 0.7,
              }}
            >
              {eventCount} events
            </span>
          </div>
        )
      })}
    </div>
  )
}
