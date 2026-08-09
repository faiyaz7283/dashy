import type { FamilyMember, CalendarEvent } from '../../types'
import { spacing, radii, typography, memberColors, colors } from '../../theme/tokens'

interface FamilyPillsProps {
  members: FamilyMember[]
  events: CalendarEvent[]
}

/**
 * Compact inline family pills for the header row.
 *
 * Shows small colored avatars with member names and event counts,
 * designed to fit within the header bar without taking extra vertical space.
 *
 * @param props - Component props.
 * @returns Inline family member pills sized for the header.
 */
export function FamilyPills({ members, events }: FamilyPillsProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: `${spacing.xs}px`,
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
              gap: '4px',
              padding: `2px ${spacing.sm}px`,
              borderRadius: `${radii.full}px`,
              border: `1px solid ${memberColor.border}`,
              background: memberColor.bg,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '9px',
                fontWeight: typography.pillAvatar.weight,
                color: colors.white,
                backgroundColor: m.color,
              }}
            >
              {m.initial}
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: typography.pillText.weight,
                color: memberColor.text,
                whiteSpace: 'nowrap',
              }}
            >
              {m.name}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: typography.pillCount.weight,
                color: memberColor.text,
                opacity: 0.7,
                whiteSpace: 'nowrap',
              }}
            >
              {eventCount}
            </span>
          </div>
        )
      })}
    </div>
  )
}
