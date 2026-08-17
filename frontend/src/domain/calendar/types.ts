/**
 * Calendar domain types.
 *
 * Defines the shape of calendar events, attendees, and view configuration
 * used across all calendar views (day, week, month, year).
 */

/** Available calendar view modes. */
export type CalendarView = 'day' | 'week' | 'month' | 'year'

/** RSVP status for an event attendee (matches backend Attendee model). */
export type AttendeeStatus = 'accepted' | 'declined' | 'tentative' | 'needsAction'

/** An event attendee with resolved display info. */
export interface Attendee {
  /** Family member key, or null for external guests. */
  member_key: string | null
  /** Attendee email address. */
  email: string
  /** Display name from the calendar provider. */
  display_name: string
  /** RSVP status. */
  status: AttendeeStatus
  /** Member color or default grey for external guests. */
  color: string
}

/** A calendar event fetched from the backend. */
export interface CalendarEvent {
  /** Unique event identifier. */
  id: string
  /** Event title. */
  title: string
  /** ISO date string for event start. */
  start: string
  /** ISO date string for event end. */
  end: string
  /** Whether the event spans the full day. */
  all_day?: boolean
  /** Optional event location. */
  location?: string
  /** Family member keys associated with this event. */
  members: string[]
  /** Optional event description. */
  description?: string | null
  /** Member key of the event organizer. */
  organizer?: string | null
  /** List of attendees with resolved display info. */
  attendees?: Attendee[]
  /** ID of the parent recurring event. */
  recurring_event_id?: string | null
  /** Whether this is an instance of a recurring series. */
  is_recurring_instance?: boolean
  /** RRULE string (e.g., "RRULE:FREQ=WEEKLY;BYDAY=MO"). */
  recurrence_rule?: string | null
}

/** A week-scoped calendar response with events bounded by date range. */
export interface WeekCalendar {
  /** ISO date string for the week start (Monday). */
  week_start: string
  /** ISO date string for the week end (Sunday). */
  week_end: string
  /** Events within the week range. */
  events: CalendarEvent[]
}
