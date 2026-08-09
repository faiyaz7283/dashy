/**
 * ViewSwitcher component for toggling between calendar views.
 *
 * Renders a segmented button group with Day/Week/Month/Year options.
 * The active view is highlighted with a distinct style.
 */

import type { CalendarView } from '../../types'
import { colors, radii, shadows, spacing, typography, layout } from '../../theme/tokens'

interface ViewSwitcherProps {
  /** Currently active view. */
  activeView: CalendarView
  /** Callback when a view is selected. */
  onViewChange: (view: CalendarView) => void
}

/** All available views in display order. */
const views: CalendarView[] = ['day', 'week', 'month', 'year']

/** Display labels for each view. */
const viewLabels: Record<CalendarView, string> = {
  day: 'Day',
  week: 'Week',
  month: 'Month',
  year: 'Year',
}

/**
 * ViewSwitcher component.
 *
 * @param props - Component props.
 * @returns The view switcher UI.
 */
export function ViewSwitcher({ activeView, onViewChange }: ViewSwitcherProps) {
  return (
    <div
      style={{
        display: 'flex',
        background: colors.bgHover,
        borderRadius: `${radii.lg}px`,
        padding: '2px',
        gap: '2px',
      }}
    >
      {views.map((view) => {
        const isActive = view === activeView
        return (
          <button
            key={view}
            onClick={() => onViewChange(view)}
            style={{
              width: `${layout.viewBtnWidth}px`,
              padding: `${spacing.sm}px 0`,
              fontSize: `${isActive ? typography.viewBtnActive.size : typography.viewBtn.size}px`,
              fontWeight: isActive ? typography.viewBtnActive.weight : typography.viewBtn.weight,
              color: isActive ? colors.primary : colors.textMuted,
              background: isActive ? colors.white : 'transparent',
              border: 'none',
              borderRadius: `${radii.md}px`,
              cursor: 'pointer',
              textAlign: 'center',
              transition: 'all 0.15s',
              boxShadow: isActive ? shadows.viewBtnActive : 'none',
            }}
          >
            {viewLabels[view]}
          </button>
        )
      })}
    </div>
  )
}
