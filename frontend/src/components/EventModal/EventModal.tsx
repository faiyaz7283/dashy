/**
 * EventModal component for displaying detailed event information.
 *
 * A modal dialog that shows full event details including time, location,
 * description, recurrence, owner, and attendees with RSVP status.
 * Opened by clicking an event in any calendar view.
 */

import type { AttendeeStatus, CalendarEvent, FamilyMember } from '../../types'
import { colors, radii, shadows, spacing, zIndices, densityColors } from '../../theme/tokens'
import { formatRecurrenceRule } from '../../utils/recurrence'

/** Small uppercase section label shared by modal body sections. */
const sectionLabelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  color: colors.textFaint,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '6px',
}

/** Human-readable RSVP status labels. */
const STATUS_LABELS: Record<AttendeeStatus, string> = {
  accepted: 'Accepted',
  declined: 'Declined',
  tentative: 'Maybe',
  needsAction: 'No response',
}

/** RSVP status label colors. */
const STATUS_COLORS: Record<AttendeeStatus, string> = {
  accepted: colors.success,
  declined: colors.danger,
  tentative: densityColors.medium.text,
  needsAction: colors.textFaint,
}

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
  // Owner is the organizer when known, otherwise the primary member
  const owner =
    (event.organizer ? members.find((m) => m.key === event.organizer) : undefined) ?? primaryMember
  const attendees = event.attendees ?? []
  const isRecurring = Boolean(event.is_recurring_instance || event.recurrence_rule)

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

          {/* Description */}
          {event.description && (
            <div style={{ marginBottom: `${spacing.lg}px` }}>
              <div style={sectionLabelStyle}>Description</div>
              <div style={{ fontSize: '14px', color: colors.textPrimary, whiteSpace: 'pre-line' }}>
                {event.description}
              </div>
            </div>
          )}

          {/* Recurrence */}
          {isRecurring && (
            <div style={{ marginBottom: `${spacing.lg}px` }}>
              <div style={sectionLabelStyle}>Repeats</div>
              <div style={{ fontSize: '14px', color: colors.textPrimary }}>
                {event.recurrence_rule
                  ? formatRecurrenceRule(event.recurrence_rule)
                  : 'Recurring event'}
              </div>
            </div>
          )}

          {/* Owner */}
          {owner && (
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
                    backgroundColor: owner.color,
                    color: colors.white,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  {owner.initial}
                </span>
                <span>{owner.name}</span>
              </div>
            </div>
          )}

          {/* Attendees (with RSVP status) — falls back to member guests */}
          {attendees.length > 0 ? (
            <div>
              <div style={sectionLabelStyle}>Attendees</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${spacing.sm}px` }}>
                {attendees.map((attendee) => (
                  <div
                    key={attendee.email}
                    style={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px` }}
                  >
                    <span
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: attendee.color,
                        color: colors.white,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 600,
                        flexShrink: 0,
                      }}
                    >
                      {attendee.display_name.trim().charAt(0).toUpperCase() || '?'}
                    </span>
                    <span
                      style={{
                        fontSize: '14px',
                        color: colors.textPrimary,
                        textDecoration: attendee.status === 'declined' ? 'line-through' : 'none',
                      }}
                    >
                      {attendee.display_name}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: STATUS_COLORS[attendee.status],
                        marginLeft: 'auto',
                      }}
                    >
                      {STATUS_LABELS[attendee.status]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Guests fallback (member list) when no attendee data */
            eventMembers.length > 1 && (
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
            )
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
