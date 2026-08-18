/**
 * DensityBadge component for displaying event counts with density coloring.
 *
 * Renders a pill-shaped badge with a background and text color based on
 * the density level (none/low/medium/high). Used in sub-headers and
 * month cards across all calendar views.
 */

import type { DensityLevel } from '@/theme/config'
import { densityColors, radii, typography } from '@/theme/tokens'

interface DensityBadgeProps {
  /** The density level determining the badge color. */
  density: DensityLevel
  /** The text to display in the badge (e.g., "12 events"). */
  label: string
}

/**
 * DensityBadge component.
 *
 * @param props - Component props.
 * @returns A density-colored badge showing an event count.
 */
export function DensityBadge({ density, label }: DensityBadgeProps) {
  const densityColor = densityColors[density]

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: `${typography.badge.size}px`,
        fontWeight: typography.badge.weight,
        padding: '3px 10px',
        borderRadius: `${radii.full}px`,
        background: densityColor.bg,
        color: densityColor.text,
      }}
    >
      {label}
    </span>
  )
}
