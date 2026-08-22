/**
 * Event popup — shows event details on hover.
 *
 * Displays:
 * - Header: member avatar + title + recurring icon (if applicable)
 * - Time row (with clock icon)
 * - Location row (with map pin icon, if present)
 * - Description row (with document icon, if present)
 * - Recurrence row (with refresh icon, if recurring)
 * - Attendees grid (2 columns, with avatar + status)
 *
 * Follows design rules:
 * - No redundant labels (icons already indicate what each row represents)
 * - Content-sized height (no fixed height)
 * - Width: w-80 (320px), scaled via useUiScale
 */

import { Clock, MapPin, FileText, RefreshCw, Users } from 'lucide-react'
import type { CalendarEvent, Attendee } from '@/types/calendar'
import { formatTime } from '@/shared/date/format'
import { isTimedEvent } from '@/types/calendar'
import { memberBgClasses, getMemberInitial, type MemberColorKey } from '@/shared/utils/memberColors'

/** Props for the EventPopup component. */
export interface EventPopupProps {
  /** The event to display. */
  event: CalendarEvent
}

/**
 * Event popup showing detailed event information.
 *
 * @param props - Event data.
 * @returns The event popup UI.
 */
export function EventPopup({ event }: EventPopupProps) {
  const memberColor = (event.members[0] ?? 'faiyaz') as MemberColorKey

  return (
    <div className="w-80 rounded-xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.15)] ring-1 ring-border dark:bg-bg dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
      <div className="space-y-3">
        {/* Header: avatar + title + recurring icon */}
        <div className="flex items-center gap-2">
          <div
            className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${memberBgClasses[memberColor]} text-[10px] font-semibold text-white`}
          >
            {getMemberInitial(memberColor)}
          </div>
          <h3 className="truncate text-sm font-semibold text-text-primary">{event.title}</h3>
          {event.is_recurring_instance && (
            <RefreshCw className="ml-auto h-3.5 w-3.5 flex-shrink-0 text-text-faint opacity-60" />
          )}
        </div>

        {/* Time row */}
        <div className="flex items-center gap-3 pl-7">
          <Clock className="h-4 w-4 flex-shrink-0 text-text-faint" />
          <div className="text-sm text-text-primary">
            {isTimedEvent(event) ? (
              <>
                {formatTime(event.start.toPlainTime())} – {formatTime(event.end.toPlainTime())}
              </>
            ) : (
              'All day'
            )}
          </div>
        </div>

        {/* Location row (if present) */}
        {event.location && (
          <div className="flex items-start gap-3 pl-7">
            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-faint" />
            <div className="break-words text-sm text-text-primary">{event.location}</div>
          </div>
        )}

        {/* Description row (if present) */}
        {event.description && (
          <div className="flex items-start gap-3 pl-7">
            <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-faint" />
            <div className="break-words text-sm text-text-primary">{event.description}</div>
          </div>
        )}

        {/* Recurrence row (if recurring) */}
        {event.recurrence_rule && (
          <div className="flex items-center gap-3 pl-7">
            <RefreshCw className="h-4 w-4 flex-shrink-0 text-text-faint" />
            <div className="text-sm text-text-primary">
              {formatRecurrenceRule(event.recurrence_rule)}
            </div>
          </div>
        )}

        {/* Attendees grid (if present) */}
        {event.attendees && event.attendees.length > 0 && (
          <div className="flex items-start gap-3 pl-7">
            <Users className="mt-0.5 h-4 w-4 flex-shrink-0 text-text-faint" />
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
              {event.attendees.map((attendee, idx) => (
                <AttendeeRow key={idx} attendee={attendee} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Single attendee row with avatar and status.
 */
function AttendeeRow({ attendee }: { attendee: Attendee }) {
  const memberColor = (attendee.member_key ?? 'faiyaz') as MemberColorKey
  const memberInitial = attendee.display_name[0]?.toUpperCase() ?? '?'

  const statusColor = getStatusColor(attendee.status)

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full ${memberBgClasses[memberColor]} text-[8px] font-semibold text-white`}
      >
        {memberInitial}
      </div>
      <span className={`text-xs font-medium ${statusColor}`}>
        {formatAttendeeStatus(attendee.status)}
      </span>
    </div>
  )
}

/**
 * Returns the Tailwind color class for an attendee status.
 */
function getStatusColor(status: Attendee['status']): string {
  switch (status) {
    case 'accepted':
      return 'text-success'
    case 'declined':
      return 'text-danger'
    case 'tentative':
      return 'text-warning'
    case 'needsAction':
      return 'text-text-muted'
  }
}

/**
 * Returns a human-readable label for an attendee status.
 */
function formatAttendeeStatus(status: Attendee['status']): string {
  switch (status) {
    case 'accepted':
      return 'Accepted'
    case 'declined':
      return 'Declined'
    case 'tentative':
      return 'Tentative'
    case 'needsAction':
      return 'No response'
  }
}

/**
 * Formats an RRULE string into a human-readable label.
 *
 * Simple implementation — handles common patterns like "FREQ=WEEKLY;BYDAY=MO,WE,FR".
 */
function formatRecurrenceRule(rule: string): string {
  // Extract FREQ and BYDAY from RRULE
  const freqMatch = rule.match(/FREQ=(\w+)/)
  const byDayMatch = rule.match(/BYDAY=([A-Z,]+)/)

  if (!freqMatch?.[1]) return 'Recurring'

  const freq = freqMatch[1]
  const days = byDayMatch?.[1] ? byDayMatch[1].split(',') : []

  const dayNames: Record<string, string> = {
    MO: 'Mon',
    TU: 'Tue',
    WE: 'Wed',
    TH: 'Thu',
    FR: 'Fri',
    SA: 'Sat',
    SU: 'Sun',
  }

  const dayLabels = days.map((d) => dayNames[d] ?? d).join(', ')

  switch (freq) {
    case 'DAILY':
      return 'Daily'
    case 'WEEKLY':
      return days.length > 0 ? `Weekly on ${dayLabels}` : 'Weekly'
    case 'MONTHLY':
      return 'Monthly'
    case 'YEARLY':
      return 'Yearly'
    default:
      return 'Recurring'
  }
}
