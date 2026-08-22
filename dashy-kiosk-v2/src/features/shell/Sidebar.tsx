/**
 * Sidebar navigation component.
 *
 * Displays feature navigation items (Calendar, Chores) with icons and labels.
 * Supports collapsed (icon-only) and expanded states. Each nav item shows an
 * action icon on hover when expanded (refresh for Calendar, add for Chores).
 *
 * The sidebar is positioned absolutely on the left edge and overlays the content
 * area. Auto-hide behavior is managed by the parent AppShell via useAutoHide.
 */

import { Calendar, ClipboardList, RefreshCw, Plus, ChevronRight } from 'lucide-react'
import { layout } from '@/theme/tokens'

/** Available features for navigation. */
export type Feature = 'calendar' | 'chores'

/** Props for the Sidebar component. */
export interface SidebarProps {
  /** Whether the sidebar is expanded (true) or collapsed (false). */
  isExpanded: boolean
  /** Toggle the sidebar state. */
  onToggle: () => void
  /** The currently active feature. */
  activeFeature: Feature
  /** Callback when a feature is selected. */
  onFeatureChange: (feature: Feature) => void
}

/**
 * Sidebar navigation component.
 *
 * @param props - Sidebar configuration and state.
 * @returns The sidebar navigation UI.
 */
export function Sidebar({ isExpanded, onToggle, activeFeature, onFeatureChange }: SidebarProps) {
  const width = isExpanded ? layout.sidebarFull : layout.sidebarCollapsed

  return (
    <aside
      className="absolute left-0 top-0 bottom-0 z-40 flex flex-col border-r border-border bg-white shadow-sidebar transition-[width] duration-300 ease-in-out"
      style={{ width }}
    >
      {/* Navigation items */}
      <nav className="relative flex flex-1 flex-col pt-4">
        <ul className="flex flex-1 flex-col gap-y-1 px-2">
          {/* Calendar */}
          <NavItem
            icon={<Calendar className="size-6 shrink-0" />}
            label="Calendar"
            actionIcon={<RefreshCw className="size-4 shrink-0" />}
            isActive={activeFeature === 'calendar'}
            isExpanded={isExpanded}
            onClick={() => onFeatureChange('calendar')}
          />

          {/* Chores */}
          <NavItem
            icon={<ClipboardList className="size-6 shrink-0" />}
            label="Chores"
            actionIcon={<Plus className="size-4 shrink-0" />}
            isActive={activeFeature === 'chores'}
            isExpanded={isExpanded}
            onClick={() => onFeatureChange('chores')}
          />
        </ul>
      </nav>

      {/* Expand/Collapse toggle button */}
      <button
        onClick={onToggle}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rounded-full border border-border bg-white p-1 shadow-md hover:bg-bg-hover"
        title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <ChevronRight
          className={`h-4 w-4 text-text-secondary transition-transform duration-300 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>
    </aside>
  )
}

/** Props for a navigation item. */
interface NavItemProps {
  /** The main icon for the nav item. */
  icon: React.ReactNode
  /** The label text (hidden when collapsed). */
  label: string
  /** The action icon shown on hover when expanded. */
  actionIcon: React.ReactNode
  /** Whether this item is currently active. */
  isActive: boolean
  /** Whether the sidebar is expanded. */
  isExpanded: boolean
  /** Click handler. */
  onClick: () => void
}

/**
 * Individual navigation item within the sidebar.
 *
 * Shows the icon always, label and action icon only when expanded.
 * Active items have a highlighted background.
 */
function NavItem({ icon, label, actionIcon, isActive, isExpanded, onClick }: NavItemProps) {
  return (
    <li>
      <button
        onClick={onClick}
        className={`group flex w-full items-center gap-x-3 rounded-md p-2 text-sm/6 font-semibold transition-colors ${
          isActive
            ? 'bg-primary-light text-primary'
            : 'text-text-secondary hover:bg-primary-light hover:text-primary'
        }`}
      >
        {/* Main icon */}
        <span className={isActive ? 'text-primary' : 'text-text-muted group-hover:text-primary'}>
          {icon}
        </span>

        {/* Label (hidden when collapsed) */}
        <span
          className={`whitespace-nowrap transition-opacity duration-200 ${
            isExpanded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {label}
        </span>

        {/* Action icon (hidden when collapsed, shown on hover when expanded) */}
        <span
          className={`ml-auto transition-opacity duration-200 ${
            isExpanded ? 'opacity-0 group-hover:opacity-100' : 'opacity-0'
          }`}
        >
          {actionIcon}
        </span>
      </button>
    </li>
  )
}
