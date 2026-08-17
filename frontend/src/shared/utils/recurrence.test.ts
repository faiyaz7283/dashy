import { describe, it, expect } from 'vitest'
import { formatRecurrenceRule } from './recurrence'

describe('formatRecurrenceRule', () => {
  it('maps frequencies to labels', () => {
    expect(formatRecurrenceRule('RRULE:FREQ=DAILY')).toBe('Daily')
    expect(formatRecurrenceRule('RRULE:FREQ=WEEKLY')).toBe('Weekly')
    expect(formatRecurrenceRule('RRULE:FREQ=MONTHLY')).toBe('Monthly')
    expect(formatRecurrenceRule('RRULE:FREQ=YEARLY')).toBe('Yearly')
  })

  it('appends BYDAY when present', () => {
    expect(formatRecurrenceRule('RRULE:FREQ=WEEKLY;BYDAY=MO')).toBe('Weekly on Mon')
    expect(formatRecurrenceRule('RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR')).toBe('Weekly on Mon, Wed, Fri')
  })

  it('strips ordinal prefixes from BYDAY codes', () => {
    expect(formatRecurrenceRule('RRULE:FREQ=MONTHLY;BYDAY=-1MO')).toBe('Monthly on Mon')
  })

  it('returns the raw rule when FREQ is missing or unknown', () => {
    expect(formatRecurrenceRule('RRULE:COUNT=5')).toBe('RRULE:COUNT=5')
    expect(formatRecurrenceRule('RRULE:FREQ=HOURLY')).toBe('RRULE:FREQ=HOURLY')
  })
})
