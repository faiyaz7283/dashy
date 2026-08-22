/**
 * View switcher component — segmented control for calendar views.
 *
 * Uses HeadlessUI Tab.Group for accessible tab navigation. Switching views
 * updates the active calendar view (day/week/month/year) in the content area.
 */

import { Tab } from '@headlessui/react'
import type { CalendarView } from '@/types/calendar'

/** Props for the ViewSwitcher component. */
export interface ViewSwitcherProps {
  /** The currently active view. */
  currentView: CalendarView
  /** Callback when a view is selected. */
  onViewChange: (view: CalendarView) => void
}

/** View labels in order. */
const VIEWS: { key: CalendarView; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
]

/**
 * Segmented control for switching between calendar views.
 *
 * @param props - View state and change handler.
 * @returns The view switcher UI.
 */
export function ViewSwitcher({ currentView, onViewChange }: ViewSwitcherProps) {
  const selectedIndex = VIEWS.findIndex((v) => v.key === currentView)

  return (
    <Tab.Group
      selectedIndex={selectedIndex}
      onChange={(idx) => {
        const view = VIEWS[idx]
        if (view) onViewChange(view.key)
      }}
    >
      <Tab.List className="flex items-center rounded-lg bg-bg-hover p-0.5">
        {VIEWS.map((view) => (
          <Tab
            key={view.key}
            className={({ selected }) =>
              `rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                selected
                  ? 'bg-white text-primary shadow-view-btn'
                  : 'text-text-muted hover:text-text-primary'
              }`
            }
          >
            {view.label}
          </Tab>
        ))}
      </Tab.List>
    </Tab.Group>
  )
}
