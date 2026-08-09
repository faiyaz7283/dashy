/**
 * EventPopup component for displaying event details on hover.
 *
 * A floating popup that appears when hovering over events in calendar views.
 * Shows event title, time, location, and member avatars.
 */

import type { CalendarEvent, FamilyMember } from '../../types'
import { colors, radii, shadows, spacing, typography, zIndices } from '../../theme/tokens'

interface EventPopupProps {
  /** Whether the popup is visible. */
  visible: boolean
  /** X position in pixels. */
  x: number
  /** Y position in pixels. */
  y: number
  /** The date label (e.g., "Aug 8"). */
  dateLabel: string
  /** Events to display. */
  events: CalendarEvent[]
  /** Family members for resolving member info. */
  members: FamilyMember[]
}

/**
 * EventPopup component.
 *
 * @param props - Component props.
 * @returns The event popup UI.
 */
export function EventPopup({ visible, x, y, dateLabel, events, members }: EventPopupProps) {
  if (!visible || events.length === 0) return null

  // Edge-aware positioning - clamp to viewport instead of flipping
  const popupWidth = 260
  const popupEstHeight = 200
  const offset = 12
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1000
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800

  let left = x + offset
  let top = y + offset
  // Clamp to viewport bounds, keeping popup as close to cursor as possible
  left = Math.max(offset, Math.min(left, vw - popupWidth - offset))
  top = Math.max(offset, Math.min(top, vh - popupEstHeight - offset))

  return (
    <div
      style={{
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        background: colors.white,
        border: `1px solid ${colors.border}`,
        borderRadius: `${radii.xl}px`,
        padding: `${spacing.md}px ${spacing.md + 2}px`,
        boxShadow: shadows.popup,
        zIndex: zIndices.popup,
        minWidth: '220px',
        maxWidth: '280px',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: colors.primary,
          marginBottom: `${spacing.sm}px`,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {dateLabel}
      </div>
      {events.map((event, idx) => {
        const eventMembers = members.filter((m) => event.members.includes(m.key))
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
        const isLast = idx === events.length - 1

        return (
          <div
            key={event.id}
            style={{
              marginBottom: isLast ? 0 : `${spacing.sm}px`,
              paddingBottom: isLast ? 0 : `${spacing.sm}px`,
              borderBottom: isLast ? 'none' : `1px solid ${colors.borderLight}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              {eventMembers.length > 0 && (
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
                    backgroundColor: eventMembers[0].color,
                    flexShrink: 0,
                  }}
                >
                  {eventMembers[0].initial}
                </span>
              )}
              <span
                style={{
                  fontSize: `${typography.eventTitle.size}px`,
                  fontWeight: typography.eventTitle.weight,
                  color: colors.textPrimary,
                }}
              >
                {event.title}
              </span>
            </div>
            <div
              style={{
                fontSize: `${typography.eventTime.size}px`,
                color: colors.textMuted,
                marginBottom: event.location ? '4px' : 0,
              }}
            >
              {event.all_day ? 'All day' : `${startTime} – ${endTime}`}
            </div>
            {event.location && (
              <div style={{ fontSize: '11px', color: colors.textFaint, marginBottom: '4px' }}>
                📍 {event.location}
              </div>
            )}
            {eventMembers.length > 1 && (
              <div style={{ display: 'flex', gap: '3px', alignItems: 'center', marginTop: '4px' }}>
                {eventMembers.slice(1).map((m) => (
                  <span
                    key={m.key}
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
                      backgroundColor: m.color,
                      border: `2px solid ${colors.white}`,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    }}
                  >
                    {m.initial}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
