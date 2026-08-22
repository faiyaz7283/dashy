/**
 * Calendar domain utilities.
 *
 * Shared functions for filtering events by date, used across all calendar
 * views (day, week, month, year). Replaces the duplicated per-view helpers.
 */

import type { CalendarEvent } from '@/types/calendar'
import { eventDate } from '@/shared/date'

/**
 * Returns all events occurring on a given date.
 *
 * Compares calendar day only (year/month/date), ignoring time components.
 *
 * @param events - The full list of calendar events.
 * @param date - The date to filter by.
 * @returns Events whose start date falls on the given day.
 */
export function getEventsForDate(
  events: CalendarEvent[],
  date: Temporal.PlainDate,
): CalendarEvent[] {
  return events.filter((e) => eventDate(e.start).equals(date))
}

/**
 * Returns timed (non-all-day) events for a given date.
 *
 * @param events - The full list of calendar events.
 * @param date - The date to filter by.
 * @returns Non-all-day events whose start date falls on the given day.
 */
export function getTimedEventsForDate(
  events: CalendarEvent[],
  date: Temporal.PlainDate,
): CalendarEvent[] {
  return events.filter((e) => !e.all_day && eventDate(e.start).equals(date))
}

/**
 * Returns all-day events for a given date.
 *
 * @param events - The full list of calendar events.
 * @param date - The date to filter by.
 * @returns All-day events whose start date falls on the given day.
 */
export function getAllDayEventsForDate(
  events: CalendarEvent[],
  date: Temporal.PlainDate,
): CalendarEvent[] {
  return events.filter((e) => e.all_day === true && eventDate(e.start).equals(date))
}
