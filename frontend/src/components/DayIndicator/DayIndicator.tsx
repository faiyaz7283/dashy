/**
 * DayIndicator — segmented micro-bar shown on year view day cells.
 *
 * A 2px-tall full-width bar at the bottom edge of a day cell, split into
 * member-colored segments (one per event). At most 4 segments are shown;
 * when a day has more than 4 events the 4th segment is grey, meaning "more".
 * Approved design: mockups/year-day-indicator-variations.html (variation B).
 */

import type { CalendarEvent, FamilyMember } from '../../types'
import { colors } from '../../theme/tokens'

interface DayIndicatorProps {
  /** Events of a single day. */
  events: CalendarEvent[]
  /** Family members for resolving segment colors. */
  members: FamilyMember[]
}

/** Maximum segments shown; beyond this the last segment turns grey ("more"). */
const MAX_SEGMENTS = 4

/**
 * DayIndicator component.
 *
 * @param props - Component props.
 * @returns The indicator bar UI, or null when the day has no events.
 */
export function DayIndicator({ events, members }: DayIndicatorProps) {
  if (events.length === 0) return null

  const segmentColors = events.slice(0, MAX_SEGMENTS).map((event) => {
    const primary = members.find((m) => event.members.includes(m.key))
    return primary ? primary.color : colors.borderDark
  })
  if (events.length > MAX_SEGMENTS) {
    segmentColors[MAX_SEGMENTS - 1] = colors.textDisabled
  }

  return (
    <div
      title={events.map((e) => e.title).join(', ')}
      style={{
        position: 'absolute',
        bottom: 0,
        left: '1px',
        right: '1px',
        height: '2px',
        display: 'flex',
        gap: '1px',
      }}
    >
      {segmentColors.map((color, idx) => (
        <span key={idx} style={{ flex: 1, minWidth: 0, background: color, borderRadius: '1px' }} />
      ))}
    </div>
  )
}
