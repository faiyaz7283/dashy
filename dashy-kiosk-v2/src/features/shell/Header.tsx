/**
 * Header component — top bar with date, clock, weather, family pills, and view switcher.
 *
 * Displays:
 * - LEFT: Current date (2 rows), clock, weather summary
 * - CENTER: Family member pills with event counts, total events
 * - RIGHT: View switcher (Day/Week/Month/Year), Today button, date picker icon
 *
 * The header is positioned absolutely on the top edge and overlays the content area.
 * Auto-hide behavior is managed by the parent AppShell via useAutoHide.
 *
 * Phase 1: Structural layout with placeholder data. Phase 2+ integrates real data.
 */

import { Clock, Calendar, Droplets, Wind } from 'lucide-react'
import { ViewSwitcher } from './ViewSwitcher'
import type { CalendarView } from '@/types/calendar'
import type { Feature } from './Sidebar'
import { useWeatherData } from '@/features/weather/hooks/useWeatherData'
import { useWeatherPopup } from '@/features/weather/hooks/useWeatherPopup'
import { useClock } from '@/shared/hooks/useClock'
import { formatHeaderDate, formatTime } from '@/shared/date'
import { getEventsForDate } from '@/shared/utils/calendar'
import { getWeekKey } from '@/shared/date/calendar'
import { formatRelativeDay } from '@/shared/date/calendar'
import { WeatherPopup } from '@/features/weather/components/WeatherPopup'
import { WeatherIcon } from '@/features/weather/components/WeatherIcon'
import { paletteBgClasses, paletteBgOpacityClasses, paletteTextClasses, paletteRingClasses } from '@/shared/utils/memberColors'
import type { FamilyMember } from '@/types/family'
import type { PaletteKey } from '@/shared/utils/memberColors'
import type { WeatherCondition } from '@/types/weather'
import type { ChoresData } from '@/types/chores'
import type { CalendarEvent } from '@/types/calendar'

/** Props for the Header component. */
export interface HeaderProps {
  /** The currently active feature (calendar or chores). */
  activeFeature: Feature
  /** The currently active calendar view. */
  currentView: CalendarView
  /** Callback when the view changes. */
  onViewChange: (view: CalendarView) => void
  /** Callback when Today is clicked. */
  onToday: () => void
  /** Family members for pill display. */
  members: FamilyMember[]
  /** Calendar events for event count display. */
  events: CalendarEvent[]
  /** Chores data for chore count display. */
  choresData: ChoresData | null
}

/**
 * Header component with date, clock, weather, family pills, and view switcher.
 *
 * @param props - Header configuration and callbacks.
 * @returns The header UI.
 */
export function Header({ activeFeature, currentView, onViewChange, onToday, members, events, choresData }: HeaderProps) {
  const { current: weather, forecast } = useWeatherData()
  const { popupRef, handleMouseEnter, handleMouseMove, handleMouseLeave } = useWeatherPopup()
  const clockTime = useClock()

  // Compute per-member event counts for the selected date (calendar feature)
  const today = Temporal.Now.plainDateISO()
  const dayEvents = getEventsForDate(events, today)
  const totalEvents = dayEvents.length

  // Compute per-member chore counts (chores feature)
  const choresByMember = new Map<string, number>()
  let totalChores = 0
  if (choresData) {
    for (const instance of choresData.instances) {
      const memberId = instance.claimed_by ?? instance.assigned_to
      if (memberId) {
        choresByMember.set(memberId, (choresByMember.get(memberId) ?? 0) + 1)
        totalChores++
      }
    }
  }

  // Compute week number and day-of-year for subtitle
  const weekKey = getWeekKey(today)
  const weekParts = weekKey.split('-W')
  const weekNumber = weekParts[1] ?? '1'
  const dayOfYear = today.dayOfYear

  // Format weather date labels
  const { dayLabel, dateLabel } = formatRelativeDay(today)

  return (
    <header
      className="absolute top-0 left-0 right-0 z-50 border-b border-border bg-white shadow-sm"
      style={{ height: 'var(--shell-header-height)' }}
    >
      <div className="flex h-full items-center justify-between px-4">
        {/* LEFT: Date + Clock + Weather — ALWAYS VISIBLE (all features) */}
        <div className="flex items-center gap-4">
          {/* Date (2 rows) */}
          <div className="flex flex-col leading-tight">
            <span className="text-base font-semibold text-text-primary">{formatHeaderDate(today)}</span>
            <span className="text-xs text-text-muted">Week {weekNumber} · Day {dayOfYear}</span>
          </div>

          {/* Clock */}
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Clock className="h-4 w-4" />
            <span className="font-mono text-sm font-medium">{formatTime(clockTime)}</span>
          </div>

          {/* Weather summary */}
          {weather && forecast[0] && (
            <>
              <div
                className="relative flex items-center gap-2 cursor-pointer"
                onMouseEnter={handleMouseEnter}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <WeatherIcon condition={weather.condition as WeatherCondition} size="sm" className="text-warning" />
                <div className="flex items-baseline gap-1.5">
                  <span className="text-sm font-semibold text-text-primary">{Math.round(weather.temperature)}°</span>
                  <span className="text-xs text-text-muted">{Math.round(weather.feels_like)}°</span>
                </div>
                <span className="hidden text-xs text-text-muted sm:inline">{weather.condition}</span>
                <div className="flex items-center gap-2 text-xs text-text-faint">
                  <span className="flex items-center gap-0.5">
                    <Droplets className="h-3 w-3" />
                    {weather.humidity}%
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Wind className="h-3 w-3" />
                    {Math.round(weather.wind_speed)} mph
                  </span>
                </div>
              </div>

              {/* Weather popup with fixed positioning */}
              <div
                ref={popupRef}
                className="fixed z-50 opacity-0 transition-opacity duration-100"
                style={{ left: -9999, top: -9999 }}
              >
                <WeatherPopup
                  forecast={forecast[0]}
                  dateLabel={dayLabel}
                  dateSublabel={dateLabel}
                />
              </div>
            </>
          )}
        </div>

        {/* CENTER: Feature-Aware Member Pills + Total Count */}
        <div className="flex items-center gap-2">
          {activeFeature === 'calendar' ? (
            <>
              {/* Calendar feature: per-member event counts */}
              {members.map((member) => {
                const memberEvents = dayEvents.filter(e => e.members.includes(member.key))
                return <FamilyPill key={member.key} member={member} count={memberEvents.length} />
              })}
              <div className="ml-1 inline-flex items-center rounded-full bg-primary-light px-2 py-1 text-xs font-medium text-primary inset-ring inset-ring-primary/20">
                {totalEvents} {totalEvents === 1 ? 'event' : 'events'}
              </div>
            </>
          ) : (
            <>
              {/* Chores feature: per-member chore counts */}
              {members.map((member) => {
                const count = choresByMember.get(member.key) ?? 0
                return <FamilyPill key={member.key} member={member} count={count} />
              })}
              <div className="ml-1 inline-flex items-center rounded-full bg-primary-light px-2 py-1 text-xs font-medium text-primary inset-ring inset-ring-primary/20">
                {totalChores} {totalChores === 1 ? 'chore' : 'chores'}
              </div>
            </>
          )}
        </div>

        {/* RIGHT: Calendar Feature Only — View Switcher + Today + Date Picker */}
        {activeFeature === 'calendar' && (
          <div className="flex items-center gap-3">
            <ViewSwitcher currentView={currentView} onViewChange={onViewChange} />

            {/* Today button */}
            <button
              onClick={onToday}
              className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-bg-hover"
            >
              Today
            </button>

            {/* Date picker trigger */}
            <button
              className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
              title="Date picker"
            >
              <Calendar className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* RIGHT: Chores Feature — Empty (no controls) */}
        {activeFeature === 'chores' && <div />}
      </div>
    </header>
  )
}

/** Props for a family member pill. */
interface FamilyPillProps {
  /** The family member. */
  member: FamilyMember
  /** Event count for this member. */
  count: number
}

/**
 * Family member pill with avatar and event count.
 *
 * Displays a colored avatar circle with the member's initial, followed by
 * the event count. Dimmed when count is 0.
 */
function FamilyPill({ member, count }: FamilyPillProps) {
  const paletteKey = (member.color_key && member.color_key in paletteBgClasses
    ? member.color_key
    : 'blue') as PaletteKey

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium inset-ring ${paletteBgOpacityClasses[paletteKey]} ${paletteTextClasses[paletteKey]} ${paletteRingClasses[paletteKey]} ${
        count === 0 ? 'opacity-50' : ''
      }`}
    >
      <div
        className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold leading-none text-white ${paletteBgClasses[paletteKey]}`}
      >
        {member.initial}
      </div>
      <span>{count}</span>
    </div>
  )
}
