/**
 * StickyArea component providing a unified sticky header for all calendar views.
 *
 * Wraps the Header component. The entire area sticks to the top when scrolling.
 * For day view, it also includes an all-day events section.
 */

import type { ReactNode } from 'react'
import { colors, zIndices } from '../../theme/tokens'

interface StickyAreaProps {
  /** The Header component. */
  header: ReactNode
  /** Optional all-day events section (day view only). */
  allDaySection?: ReactNode
}

/**
 * StickyArea component.
 *
 * @param props - Component props.
 * @returns The unified sticky header area.
 */
export function StickyArea({ header, allDaySection }: StickyAreaProps) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: zIndices.stickyArea,
        background: colors.white,
        borderBottom: `1px solid ${colors.border}`,
        flexShrink: 0,
      }}
    >
      {header}
      {allDaySection && (
        <div style={{ borderTop: `1px solid ${colors.border}` }}>{allDaySection}</div>
      )}
    </div>
  )
}
