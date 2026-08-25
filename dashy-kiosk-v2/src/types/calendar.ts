/**
 * Calendar domain types.
 *
 * Defines the shape of calendar events, attendees, and view configuration
 * used across all calendar views (day, week, month, year).
 *
 * CalendarEvent is a discriminated union on the `all_day` field:
 * - AllDayCalendarEvent: start/end are PlainDate (calendar dates without time)
 * - TimedCalendarEvent: start/end are PlainDateTime (date + time without timezone)
 *
 * This design enforces type safety — code that handles timed events can access
 * hour/minute properties directly, while all-day event handlers work with dates only.
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
  /** Member color (hex) or default grey for external guests. */
  color: string
  /** Palette key for Tailwind class mapping, or null for guests. */
  color_key: string | null
}

/** Common fields shared by all calendar events. */
interface CalendarEventBase {
  /** Unique event identifier. */
  id: string
  /** Event title. */
  title: string
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

/** An all-day calendar event — start and end are calendar dates without time. */
export interface AllDayCalendarEvent extends CalendarEventBase {
  /** Discriminator: true for all-day events. */
  all_day: true
  /** Event start date (PlainDate — no time component). */
  start: Temporal.PlainDate
  /** Event end date (PlainDate — no time component). */
  end: Temporal.PlainDate
}

/** A timed calendar event — start and end include time of day. */
export interface TimedCalendarEvent extends CalendarEventBase {
  /** Discriminator: false or undefined for timed events. */
  all_day?: false
  /** Event start date+time (PlainDateTime — includes hour/minute). */
  start: Temporal.PlainDateTime
  /** Event end date+time (PlainDateTime — includes hour/minute). */
  end: Temporal.PlainDateTime
}

/**
 * A calendar event — discriminated union on the `all_day` field.
 *
 * Use the type guards `isAllDayEvent()` and `isTimedEvent()` to narrow the type
 * and access the appropriate start/end properties.
 *
 * @example
 * ```ts
 * if (isTimedEvent(event)) {
 *   console.log(event.start.hour) // PlainDateTime has hour/minute
 * } else {
 *   console.log(event.start.day)  // PlainDate has day/month/year
 * }
 * ```
 */
export type CalendarEvent = AllDayCalendarEvent | TimedCalendarEvent

/**
 * Type guard: checks if an event is an all-day event.
 *
 * @param event - The event to check.
 * @returns True if the event is an AllDayCalendarEvent.
 */
export function isAllDayEvent(event: CalendarEvent): event is AllDayCalendarEvent {
  return event.all_day === true
}

/**
 * Type guard: checks if an event is a timed event.
 *
 * @param event - The event to check.
 * @returns True if the event is a TimedCalendarEvent.
 */
export function isTimedEvent(event: CalendarEvent): event is TimedCalendarEvent {
  return event.all_day !== true
}

/** A week-scoped calendar response with events bounded by date range. */
export interface WeekCalendar {
  /** Week start date (PlainDate — Monday). */
  week_start: Temporal.PlainDate
  /** Week end date (PlainDate — Sunday). */
  week_end: Temporal.PlainDate
  /** Events within the week range. */
  events: CalendarEvent[]
}
