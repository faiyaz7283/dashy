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
import { layout } from '@/theme/tokens'
import { memberBgClasses, memberBgOpacityClasses, memberTextClasses, type MemberColorKey } from '@/shared/utils/memberColors'

/** Props for the Header component. */
export interface HeaderProps {
  /** The currently active calendar view. */
  currentView: CalendarView
  /** Callback when the view changes. */
  onViewChange: (view: CalendarView) => void
  /** Callback when Today is clicked. */
  onToday: () => void
}

/**
 * Header component with date, clock, weather, family pills, and view switcher.
 *
 * @param props - Header configuration and callbacks.
 * @returns The header UI.
 */
export function Header({ currentView, onViewChange, onToday }: HeaderProps) {
  return (
    <header
      className="absolute top-0 left-0 right-0 z-50 border-b border-border bg-white shadow-sm"
      style={{ height: layout.headerHeight }}
    >
      <div className="flex h-full items-center justify-between px-4">
        {/* LEFT: Date + Clock + Weather */}
        <div className="flex items-center gap-4">
          {/* Date (2 rows) */}
          <div className="flex flex-col leading-tight">
            <span className="text-base font-semibold text-text-primary">Wed, Aug 21st</span>
            <span className="text-xs text-text-muted">Week 34 · Day 233</span>
          </div>

          {/* Clock */}
          <div className="flex items-center gap-1.5 text-text-secondary">
            <Clock className="h-4 w-4" />
            <span className="font-mono text-sm font-medium">6:19 PM</span>
          </div>

          {/* Weather summary */}
          <div className="flex items-center gap-2">
            {/* Weather icon placeholder — will be custom SVG in Phase 2 */}
            <div className="h-5 w-5 rounded-full bg-warning" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-sm font-semibold text-text-primary">83°</span>
              <span className="text-xs text-text-muted">68°</span>
            </div>
            <span className="hidden text-xs text-text-muted sm:inline">clear</span>
            <div className="flex items-center gap-2 text-xs text-text-faint">
              <span className="flex items-center gap-0.5">
                <Droplets className="h-3 w-3" />
                55%
              </span>
              <span className="flex items-center gap-0.5">
                <Wind className="h-3 w-3" />
                4 mph
              </span>
            </div>
          </div>
        </div>

        {/* CENTER: Family Pills + Total Events */}
        <div className="flex items-center gap-2">
          {/* Family pills — placeholder data */}
          <FamilyPill name="F" color="faiyaz" count={3} />
          <FamilyPill name="T" color="trisha" count={2} />
          <FamilyPill name="A" color="arya" count={1} />
          <FamilyPill name="R" color="raya" count={0} />

          {/* Total events */}
          <div className="ml-1 inline-flex items-center rounded-full bg-primary-light px-2 py-1 text-xs font-medium text-primary inset-ring inset-ring-primary/20">
            6 events
          </div>
        </div>

        {/* RIGHT: View Switcher + Today + Date Picker */}
        <div className="flex items-center gap-3">
          <ViewSwitcher currentView={currentView} onViewChange={onViewChange} />

          {/* Today button */}
          <button
            onClick={onToday}
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-text-primary transition-colors hover:bg-bg-hover"
          >
            Today
          </button>

          {/* Date picker trigger — placeholder for Phase 2 */}
          <button
            className="rounded-lg p-1.5 text-text-secondary transition-colors hover:bg-bg-hover hover:text-text-primary"
            title="Date picker"
          >
            <Calendar className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  )
}

/** Props for a family member pill. */
interface FamilyPillProps {
  /** Single character initial for the avatar. */
  name: string
  /** Member color key (maps to Tailwind color). */
  color: MemberColorKey
  /** Event count for this member. */
  count: number
}

/**
 * Family member pill with avatar and event count.
 *
 * Displays a colored avatar circle with the member's initial, followed by
 * the event count. Dimmed when count is 0.
 */
function FamilyPill({ name, color, count }: FamilyPillProps) {
  const ringClasses = {
    faiyaz: 'inset-ring-faiyaz/20',
    trisha: 'inset-ring-trisha/20',
    arya: 'inset-ring-arya/20',
    raya: 'inset-ring-raya/20',
  } as const

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-medium inset-ring ${memberBgOpacityClasses[color]} ${memberTextClasses[color]} ${ringClasses[color]} ${
        count === 0 ? 'opacity-50' : ''
      }`}
    >
      <div
        className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold leading-none text-white ${memberBgClasses[color]}`}
      >
        {name}
      </div>
      <span>{count}</span>
    </div>
  )
}
