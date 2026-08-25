/**
 * Tests for calendar utility functions.
 *
 * Validates event filtering by date for day/week/month/year views.
 */

import { describe, it, expect } from 'vitest'
import { getEventsForDate, getTimedEventsForDate, getAllDayEventsForDate } from './calendar'
import type { CalendarEvent } from '@/types/calendar'

describe('calendar utilities', () => {
  const testDate = Temporal.PlainDate.from('2026-01-15')
  const otherDate = Temporal.PlainDate.from('2026-01-16')

  // Test events
  const timedEventOnDate: CalendarEvent = {
    id: '1',
    title: 'Team Meeting',
    start: Temporal.PlainDateTime.from('2026-01-15T10:00:00'),
    end: Temporal.PlainDateTime.from('2026-01-15T11:00:00'),
    all_day: false,
    members: ['alice'],
  }

  const allDayEventOnDate: CalendarEvent = {
    id: '2',
    title: 'Conference',
    start: testDate,
    end: testDate,
    all_day: true,
    members: ['bob'],
  }

  const timedEventOtherDate: CalendarEvent = {
    id: '3',
    title: 'Lunch',
    start: Temporal.PlainDateTime.from('2026-01-16T12:00:00'),
    end: Temporal.PlainDateTime.from('2026-01-16T13:00:00'),
    all_day: false,
    members: ['charlie'],
  }

  const allDayEventOtherDate: CalendarEvent = {
    id: '4',
    title: 'Holiday',
    start: otherDate,
    end: otherDate,
    all_day: true,
    members: ['alice'],
  }

  const events: CalendarEvent[] = [
    timedEventOnDate,
    allDayEventOnDate,
    timedEventOtherDate,
    allDayEventOtherDate,
  ]

  describe('getEventsForDate', () => {
    it('returns all events on the given date', () => {
      const result = getEventsForDate(events, testDate)
      expect(result).toHaveLength(2)
      expect(result).toContainEqual(timedEventOnDate)
      expect(result).toContainEqual(allDayEventOnDate)
    })

    it('returns empty array when no events on date', () => {
      const date = Temporal.PlainDate.from('2026-01-20')
      const result = getEventsForDate(events, date)
      expect(result).toHaveLength(0)
    })

    it('does not include events from other dates', () => {
      const result = getEventsForDate(events, testDate)
      expect(result).not.toContainEqual(timedEventOtherDate)
      expect(result).not.toContainEqual(allDayEventOtherDate)
    })

    it('handles empty events array', () => {
      const result = getEventsForDate([], testDate)
      expect(result).toHaveLength(0)
    })
  })

  describe('getTimedEventsForDate', () => {
    it('returns only timed events on the given date', () => {
      const result = getTimedEventsForDate(events, testDate)
      expect(result).toHaveLength(1)
      expect(result).toContainEqual(timedEventOnDate)
    })

    it('excludes all-day events', () => {
      const result = getTimedEventsForDate(events, testDate)
      expect(result).not.toContainEqual(allDayEventOnDate)
    })

    it('returns empty array when no timed events on date', () => {
      const date = Temporal.PlainDate.from('2026-01-20')
      const result = getTimedEventsForDate(events, date)
      expect(result).toHaveLength(0)
    })

    it('handles empty events array', () => {
      const result = getTimedEventsForDate([], testDate)
      expect(result).toHaveLength(0)
    })
  })

  describe('getAllDayEventsForDate', () => {
    it('returns only all-day events on the given date', () => {
      const result = getAllDayEventsForDate(events, testDate)
      expect(result).toHaveLength(1)
      expect(result).toContainEqual(allDayEventOnDate)
    })

    it('excludes timed events', () => {
      const result = getAllDayEventsForDate(events, testDate)
      expect(result).not.toContainEqual(timedEventOnDate)
    })

    it('returns empty array when no all-day events on date', () => {
      const date = Temporal.PlainDate.from('2026-01-20')
      const result = getAllDayEventsForDate(events, date)
      expect(result).toHaveLength(0)
    })

    it('handles empty events array', () => {
      const result = getAllDayEventsForDate([], testDate)
      expect(result).toHaveLength(0)
    })
  })
})
