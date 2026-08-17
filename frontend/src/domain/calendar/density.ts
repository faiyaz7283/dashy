/**
 * Density badge info computation for the dashboard header.
 *
 * Calculates event counts and density levels based on the active view
 * and selected date. Extracted from App.tsx to keep the layout orchestrator
 * focused on composition.
 */

import type { CalendarEvent, CalendarView } from '@/types'
import { isSameDay, getWeekDays } from '@/shared/utils/dateFormat'
import { getRelativeDensity, getAbsoluteDensity } from '@/shared/utils/density'
import type { DensityLevel } from '@/theme/config'

/**
 * Density badge information for the header display.
 */
export interface DensityInfo {
  /** The computed density level (none/low/medium/high). */
  density: DensityLevel
  /** Full text label (e.g., "5 events"). */
  label: string
  /** Compact label for narrow viewports (e.g., "5"). */
  shortLabel: string
}

/**
 * Computes density badge info based on the current view and date.
 *
 * @param view - The active calendar view.
 * @param date - The currently selected date.
 * @param events - All calendar events for the active range.
 * @returns Density info with level, label, and short label.
 */
export function getDensityInfo(
  view: CalendarView,
  date: Date,
  events: CalendarEvent[],
): DensityInfo {
  switch (view) {
    case 'day': {
      const dayEvents = events.filter((e) => isSameDay(new Date(e.start), date))
      const density = getAbsoluteDensity(dayEvents.length)
      return {
        density,
        label: `${dayEvents.length} event${dayEvents.length !== 1 ? 's' : ''}`,
        shortLabel: String(dayEvents.length),
      }
    }
    case 'week': {
      const weekDays = getWeekDays(date)
      const weekStart = weekDays[0]!
      const weekEnd = weekDays[6]!
      const weekEvents = events.filter((e) => {
        const d = new Date(e.start)
        return d >= weekStart && d <= weekEnd
      })
      const density = getRelativeDensity(weekEvents.length, [weekEvents.length])
      return {
        density,
        label: `${weekEvents.length} events`,
        shortLabel: String(weekEvents.length),
      }
    }
    case 'month': {
      const monthEvents = events.filter((e) => {
        const d = new Date(e.start)
        return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth()
      })
      const density = getRelativeDensity(monthEvents.length, [monthEvents.length])
      return {
        density,
        label: `${monthEvents.length} events`,
        shortLabel: String(monthEvents.length),
      }
    }
    case 'year': {
      const yearEvents = events.filter((e) => {
        const d = new Date(e.start)
        return d.getFullYear() === date.getFullYear()
      })
      const density = getRelativeDensity(yearEvents.length, [yearEvents.length])
      return {
        density,
        label: `${yearEvents.length} events`,
        shortLabel: String(yearEvents.length),
      }
    }
  }
}
