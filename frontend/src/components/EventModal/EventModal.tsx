/**
 * EventModal component for displaying detailed event information.
 *
 * A modal dialog that shows full event details including time, location,
 * owner, and guests. Used in day view when clicking on an event.
 */

import type { CalendarEvent, FamilyMember } from '../../types'
import { colors, radii, shadows, spacing, zIndices } from '../../theme/tokens'

interface EventModalProps {
  /** Whether the modal is visible. */
  visible: boolean
  /** The event to display. */
  event: CalendarEvent | null
  /** Family members for resolving member info. */
  members: FamilyMember[]
  /** Callback to close the modal. */
  onClose: () => void
  /** Callback to edit the event. */
  onEdit?: () => void
  /** Callback to delete the event. */
  onDelete?: () => void
}

/**
 * EventModal component.
 *
 * @param props - Component props.
 * @returns The event modal UI.
 */
export function EventModal({
  visible,
  event,
  members,
  onClose,
  onEdit,
  onDelete,
}: EventModalProps) {
  if (!visible || !event) return null

  const eventMembers = members.filter((m) => event.members.includes(m.key))
  const primaryMember = eventMembers[0]

  const startTime = new Date(event.start).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  const endTime = new Date(event.end).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        zIndex: zIndices.modal,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: colors.white,
          borderRadius: `${radii['2xl']}px`,
          maxWidth: '480px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'hidden',
          boxShadow: shadows.modal,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `${spacing.lg}px ${spacing.xl}px`,
            borderBottom: `1px solid ${colors.border}`,
          }}
        >
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 600,
              color: colors.textPrimary,
              margin: 0,
            }}
          >
            {event.title}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '24px',
              color: colors.textMuted,
              borderRadius: `${radii.md}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: `${spacing.xl}px` }}>
          {/* Time */}
          <div style={{ marginBottom: `${spacing.lg}px` }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: colors.textFaint,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '6px',
              }}
            >
              Time
            </div>
            <div style={{ fontSize: '14px', color: colors.textPrimary }}>
              {event.all_day ? 'All day' : `${startTime} – ${endTime}`}
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div style={{ marginBottom: `${spacing.lg}px` }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: colors.textFaint,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '6px',
                }}
              >
                Location
              </div>
              <div style={{ fontSize: '14px', color: colors.textPrimary }}>{event.location}</div>
            </div>
          )}

          {/* Owner */}
          {primaryMember && (
            <div style={{ marginBottom: `${spacing.lg}px` }}>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: colors.textFaint,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '6px',
                }}
              >
                Owner
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: `${spacing.sm}px`,
                  fontSize: '14px',
                  color: colors.textPrimary,
                }}
              >
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: primaryMember.color,
                    color: colors.white,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {primaryMember.initial}
                </span>
                <span>{primaryMember.name}</span>
              </div>
            </div>
          )}

          {/* Guests */}
          {eventMembers.length > 1 && (
            <div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: colors.textFaint,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  marginBottom: '6px',
                }}
              >
                Guests
              </div>
              <div style={{ display: 'flex', gap: `${spacing.sm}px` }}>
                {eventMembers.slice(1).map((m) => (
                  <span
                    key={m.key}
                    title={m.name}
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: m.color,
                      color: colors.white,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    {m.initial}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            gap: `${spacing.sm}px`,
            padding: `${spacing.lg}px ${spacing.xl}px`,
            borderTop: `1px solid ${colors.border}`,
            justifyContent: 'flex-end',
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: `${spacing.sm}px ${spacing.lg}px`,
              borderRadius: `${radii.md}px`,
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              background: colors.bgHover,
              color: colors.textSecondary,
            }}
          >
            Close
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              style={{
                padding: `${spacing.sm}px ${spacing.lg}px`,
                borderRadius: `${radii.md}px`,
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                border: 'none',
                background: colors.primary,
                color: colors.white,
              }}
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              style={{
                padding: `${spacing.sm}px ${spacing.lg}px`,
                borderRadius: `${radii.md}px`,
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                border: 'none',
                background: colors.dangerBg,
                color: colors.dangerText,
              }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
