/**
 * SideNav component for calendar date navigation.
 *
 * Renders fixed-position left/right arrow buttons on the sides of the screen
 * for navigating between dates/weeks/months/years.
 */

import { colors, layout, shadows, zIndices } from '@/theme/tokens'

interface SideNavProps {
  /** Callback when the previous button is clicked. */
  onPrevious: () => void
  /** Callback when the next button is clicked. */
  onNext: () => void
  /** Title for the previous button. */
  previousTitle?: string
  /** Title for the next button. */
  nextTitle?: string
  /** Current sidebar width in pixels. */
  sidebarWidth: number
}

/**
 * Shared arrow button style.
 */
const arrowStyle: React.CSSProperties = {
  width: `${layout.sideNavArrowSize}px`,
  height: `${layout.sideNavArrowSize}px`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: colors.white,
  border: `1px solid ${colors.border}`,
  borderRadius: '50%',
  cursor: 'pointer',
  color: colors.textFaint,
  boxShadow: shadows.sideNavArrow,
  transition: 'all 0.15s',
  opacity: 0.7,
  fontSize: '18px',
}

/**
 * SideNav component with fixed-position left/right arrows.
 *
 * @param props - Component props.
 * @returns The side navigation UI.
 */
export function SideNav({
  onPrevious,
  onNext,
  previousTitle = 'Previous',
  nextTitle = 'Next',
  sidebarWidth,
}: SideNavProps) {
  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: '50%',
          transform: 'translateY(-50%)',
          left: `${sidebarWidth + 8}px`,
          zIndex: zIndices.sideNav,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          transition: 'left 0.25s',
        }}
      >
        <button
          onClick={onPrevious}
          title={previousTitle}
          className="hover-arrow"
          style={arrowStyle}
        >
          ‹
        </button>
      </div>
      <div
        style={{
          position: 'fixed',
          top: '50%',
          transform: 'translateY(-50%)',
          right: '8px',
          zIndex: zIndices.sideNav,
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <button onClick={onNext} title={nextTitle} className="hover-arrow" style={arrowStyle}>
          ›
        </button>
      </div>
    </>
  )
}
