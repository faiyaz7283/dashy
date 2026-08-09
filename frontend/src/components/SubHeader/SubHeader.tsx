/**
 * SubHeader component for calendar views.
 *
 * Displays the view-specific title (e.g., "Saturday, August 8th, 2026" for
 * day view) and a density-colored event count badge. Used inside the
 * unified StickyArea below the FamilyPills.
 */

import type { DensityLevel } from '../../theme/config'
import { colors, spacing, typography } from '../../theme/tokens'
import { DensityBadge } from '../DensityBadge'

interface SubHeaderProps {
  /** The title text (e.g., "August 2026" for month view). */
  title: string
  /** The density level for the event count badge. */
  density: DensityLevel
  /** The event count label (e.g., "18 events"). */
  eventCountLabel: string
}

/**
 * SubHeader component.
 *
 * @param props - Component props.
 * @returns The sub-header UI with title and density badge.
 */
export function SubHeader({ title, density, eventCountLabel }: SubHeaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `${spacing.md}px ${spacing.xl}px`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span
          style={{
            fontSize: `${typography.subHeaderTitle.size}px`,
            fontWeight: typography.subHeaderTitle.weight,
            color: colors.textPrimary,
          }}
        >
          {title}
        </span>
        <DensityBadge density={density} label={eventCountLabel} />
      </div>
    </div>
  )
}
