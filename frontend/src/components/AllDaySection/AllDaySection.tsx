/**
 * AllDaySection component for displaying all-day events.
 *
 * Renders inside the sticky area for day view, showing all-day events
 * with member-colored left borders.
 */

import type { CalendarEvent, FamilyMember } from '../../types'
import { colors, spacing, radii, typography, memberColors } from '../../theme/tokens'

interface AllDaySectionProps {
  /** All-day events to display. */
  events: CalendarEvent[]
  /** Family members for resolving member info. */
  members: FamilyMember[]
}

/**
 * AllDaySection component.
 *
 * @param props - Component props.
 * @returns The all-day events section UI.
 */
export function AllDaySection({ events, members }: AllDaySectionProps) {
  if (events.length === 0) return null

  return (
    <div
      style={{
        background: colors.bg,
        borderTop: `1px solid ${colors.border}`,
        padding: `${spacing.sm}px ${spacing.xl}px`,
      }}
    >
      <div
        style={{
          fontSize: `${typography.allDayLabel.size}px`,
          fontWeight: typography.allDayLabel.weight,
          color: colors.textFaint,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '6px',
        }}
      >
        All-day
      </div>
      {events.map((event) => {
        const eventMembers = members.filter((m) => event.members.includes(m.key))
        const primaryMember = eventMembers[0]
        const mc = primaryMember ? memberColors[primaryMember.key] : null

        return (
          <div
            key={event.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: `${spacing.sm}px`,
              padding: '6px 10px',
              borderRadius: `${radii.md}px`,
              marginBottom: '4px',
              fontSize: '13px',
              fontWeight: 500,
              borderLeft: `3px solid ${mc ? mc.avatar : colors.border}`,
              background: mc ? mc.bg : colors.bgHover,
              color: mc ? mc.text : colors.textMuted,
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
            <span>{event.title}</span>
          </div>
        )
      })}
    </div>
  )
}
