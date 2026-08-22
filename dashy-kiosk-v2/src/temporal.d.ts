/**
 * Global Temporal type declarations.
 *
 * The Temporal API is natively available in Chromium 144+ (our kiosk runs 151).
 * For TypeScript compilation and test environments (Node.js/jsdom), we use
 * the @js-temporal/polyfill package which provides both runtime and types.
 */

import * as TemporalModule from '@js-temporal/polyfill'

declare global {
  const Temporal: typeof TemporalModule.Temporal
  namespace Temporal {
    export type PlainDate = TemporalModule.Temporal.PlainDate
    export type PlainTime = TemporalModule.Temporal.PlainTime
    export type PlainDateTime = TemporalModule.Temporal.PlainDateTime
    export type PlainYearMonth = TemporalModule.Temporal.PlainYearMonth
    export type PlainMonthDay = TemporalModule.Temporal.PlainMonthDay
    export type Duration = TemporalModule.Temporal.Duration
    export type Instant = TemporalModule.Temporal.Instant
    export type ZonedDateTime = TemporalModule.Temporal.ZonedDateTime
    export type TimeZone = TemporalModule.Temporal.TimeZone
    export type Calendar = TemporalModule.Temporal.Calendar
  }
}
