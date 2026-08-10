/**
 * Recurrence rule (RRULE) utilities for calendar events.
 *
 * The backend provides raw RRULE strings (e.g. "RRULE:FREQ=WEEKLY;BYDAY=MO")
 * on recurring events. These helpers turn them into human-readable labels.
 */

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  MONTHLY: 'Monthly',
  YEARLY: 'Yearly',
}

const DAY_LABELS: Record<string, string> = {
  MO: 'Mon',
  TU: 'Tue',
  WE: 'Wed',
  TH: 'Thu',
  FR: 'Fri',
  SA: 'Sat',
  SU: 'Sun',
}

/**
 * Humanizes an RRULE string.
 *
 * @param rule - Raw RRULE (e.g. "RRULE:FREQ=WEEKLY;BYDAY=MO,WE").
 * @returns A label like "Weekly on Mon, Wed", or the raw rule when unparseable.
 *
 * @example
 * ```ts
 * formatRecurrenceRule('RRULE:FREQ=DAILY')        // 'Daily'
 * formatRecurrenceRule('RRULE:FREQ=WEEKLY;BYDAY=MO,WE')  // 'Weekly on Mon, Wed'
 * ```
 */
export function formatRecurrenceRule(rule: string): string {
  const attrs = new Map<string, string>()
  for (const part of rule.replace(/^RRULE:/i, '').split(';')) {
    const [key, value] = part.split('=')
    if (key && value) attrs.set(key.toUpperCase(), value)
  }

  const freq = attrs.get('FREQ')
  const label = freq ? FREQUENCY_LABELS[freq.toUpperCase()] : undefined
  if (!label) return rule

  const byday = attrs.get('BYDAY')
  if (byday) {
    const days = byday.split(',').map((d) => {
      // Strip ordinal prefixes (e.g. "-1MO" = last Monday of the month)
      const code = d.replace(/^-?\d+/, '').toUpperCase()
      return DAY_LABELS[code] ?? d
    })
    return `${label} on ${days.join(', ')}`
  }

  return label
}
