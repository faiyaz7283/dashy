/**
 * Parse API wire-format date strings into Temporal types.
 *
 * The backend sends dates in several formats depending on the data source:
 * - Calendar events: `"2026-08-08"` (all-day) or `"2026-08-08T14:00:00"` (timed)
 * - Weather forecasts: `"2026-08-08"` (daily), `"2026-08-08T14:00:00"` (hourly)
 * - Sunrise/sunset: `"HH:MM"` or full ISO datetime
 *
 * Each parser is typed to return the correct Temporal type for its domain concept,
 * so callers never need to guess whether they have a date, time, or datetime.
 */

import type { CalendarEvent, WeekCalendar } from '@/types/calendar'

/**
 * Strips timezone designators from an ISO datetime string.
 *
 * Google Calendar API returns datetimes with timezone info (e.g., "Z" or "-04:00").
 * Temporal.PlainDateTime doesn't accept timezone designators, so we strip them.
 * The backend handles timezone conversions; the frontend treats all times as local.
 *
 * @param iso - ISO datetime string, possibly with timezone.
 * @returns Datetime string without timezone designator.
 *
 * @example
 * ```ts
 * stripTimezone('2026-08-08T14:00:00Z')       // '2026-08-08T14:00:00'
 * stripTimezone('2026-08-08T14:00:00-04:00')  // '2026-08-08T14:00:00'
 * stripTimezone('2026-08-08T14:00:00')        // '2026-08-08T14:00:00'
 * ```
 */
function stripTimezone(iso: string): string {
  // Remove trailing "Z"
  if (iso.endsWith('Z')) {
    return iso.slice(0, -1)
  }
  // Remove timezone offset like "+00:00" or "-04:00"
  const tzMatch = iso.match(/([+-]\d{2}:\d{2})$/)
  if (tzMatch && tzMatch[1]) {
    return iso.slice(0, -tzMatch[1].length)
  }
  return iso
}

/** Raw calendar event from the API (before parsing). */
export interface RawCalendarEvent {
  id: string
  title: string
  start: string
  end: string
  all_day?: boolean
  location?: string
  members: string[]
  description?: string | null
  organizer?: string | null
  attendees?: Array<{
    member_key: string | null
    email: string
    display_name: string
    status: 'accepted' | 'declined' | 'tentative' | 'needsAction'
    color: string
    color_key: string | null
  }>
  recurring_event_id?: string | null
  is_recurring_instance?: boolean
  recurrence_rule?: string | null
}

/** Raw week calendar response from the API (before parsing). */
export interface RawWeekCalendar {
  week_start: string
  week_end: string
  events: RawCalendarEvent[]
}

/**
 * Parses a calendar event start string into the appropriate Temporal type.
 *
 * All-day events produce a PlainDate; timed events produce a PlainDateTime.
 * The `allDay` flag determines which parser to use.
 *
 * @param iso - ISO date string from the API.
 * @param allDay - Whether the event is an all-day event.
 * @returns PlainDate for all-day events, PlainDateTime for timed events.
 *
 * @example
 * ```ts
 * parseEventStart('2026-08-08', true)          // PlainDate(2026-08-08)
 * parseEventStart('2026-08-08T14:00:00', false) // PlainDateTime(2026-08-08T14:00:00)
 * ```
 */
export function parseEventStart(
  iso: string,
  allDay: boolean,
): Temporal.PlainDate | Temporal.PlainDateTime {
  return allDay ? Temporal.PlainDate.from(iso) : Temporal.PlainDateTime.from(stripTimezone(iso))
}

/**
 * Parses a calendar event end string into the appropriate Temporal type.
 *
 * Identical logic to {@link parseEventStart} — separated for call-site clarity.
 *
 * @param iso - ISO date string from the API.
 * @param allDay - Whether the event is an all-day event.
 * @returns PlainDate for all-day events, PlainDateTime for timed events.
 */
export function parseEventEnd(
  iso: string,
  allDay: boolean,
): Temporal.PlainDate | Temporal.PlainDateTime {
  return allDay ? Temporal.PlainDate.from(iso) : Temporal.PlainDateTime.from(stripTimezone(iso))
}

/**
 * Parses a weather forecast date string to a PlainDate.
 *
 * The backend sends daily forecast dates as `"YYYY-MM-DD"` in local timezone.
 *
 * @param dateStr - Date string in YYYY-MM-DD format.
 * @returns The parsed PlainDate.
 *
 * @example
 * ```ts
 * parseForecastDate('2026-08-08') // PlainDate(2026-08-08)
 * ```
 */
export function parseForecastDate(dateStr: string): Temporal.PlainDate {
  return Temporal.PlainDate.from(dateStr)
}

/**
 * Parses a weather time string to a PlainTime.
 *
 * Handles two formats from the backend:
 * - `"HH:MM"` — simple time (sunrise/sunset from some adapters)
 * - `"YYYY-MM-DDTHH:MM:SS"` — full ISO datetime (OWM adapter timestamp conversion)
 *
 * @param timeStr - Time string in HH:MM or ISO datetime format.
 * @returns The parsed PlainTime.
 *
 * @example
 * ```ts
 * parseWeatherTime('06:30')                     // PlainTime(06:30)
 * parseWeatherTime('2026-08-08T14:00:00')       // PlainTime(14:00)
 * ```
 */
export function parseWeatherTime(timeStr: string): Temporal.PlainTime {
  if (timeStr.includes('T')) {
    return Temporal.PlainDateTime.from(stripTimezone(timeStr)).toPlainTime()
  }
  return Temporal.PlainTime.from(timeStr)
}

/**
 * Parses a date-range query parameter to a PlainDate.
 *
 * Used for constructing API query strings from the selected navigation date.
 *
 * @param dateStr - Date string in YYYY-MM-DD format.
 * @returns The parsed PlainDate.
 */
export function parseQueryDate(dateStr: string): Temporal.PlainDate {
  return Temporal.PlainDate.from(dateStr)
}

/**
 * Parses a raw calendar event from the API into a typed CalendarEvent.
 *
 * Converts the string start/end fields to the appropriate Temporal type
 * based on the `all_day` flag. This is the boundary between the API's
 * wire format and the type-safe domain model.
 *
 * @param raw - The raw event from the API.
 * @returns A typed CalendarEvent with Temporal date/time fields.
 *
 * @example
 * ```ts
 * const event = parseCalendarEvent({
 *   id: '123',
 *   title: 'Meeting',
 *   start: '2026-08-08T14:00:00',
 *   end: '2026-08-08T15:00:00',
 *   all_day: false,
 *   members: ['alice']
 * })
 * // event.start is Temporal.PlainDateTime
 * ```
 */
export function parseCalendarEvent(raw: RawCalendarEvent): CalendarEvent {
  const isAllDay = raw.all_day === true

  if (isAllDay) {
    return {
      ...raw,
      all_day: true,
      start: Temporal.PlainDate.from(raw.start),
      end: Temporal.PlainDate.from(raw.end),
    }
  }

  return {
    ...raw,
    all_day: false,
    start: Temporal.PlainDateTime.from(stripTimezone(raw.start)),
    end: Temporal.PlainDateTime.from(stripTimezone(raw.end)),
  }
}

/**
 * Parses a raw week calendar response from the API into a typed WeekCalendar.
 *
 * Converts all events and the week boundaries to Temporal types.
 *
 * @param raw - The raw response from the API.
 * @returns A typed WeekCalendar with Temporal date fields.
 */
export function parseWeekCalendar(raw: RawWeekCalendar): WeekCalendar {
  return {
    week_start: Temporal.PlainDate.from(raw.week_start),
    week_end: Temporal.PlainDate.from(raw.week_end),
    events: raw.events.map(parseCalendarEvent),
  }
}
