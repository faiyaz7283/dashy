/**
 * Navigation arrows — fixed-position prev/next buttons overlaying content area.
 *
 * Transparent until hover, centered vertically on left/right edges.
 * Used by all calendar views for period navigation.
 */

import { ChevronLeft, ChevronRight } from 'lucide-react'

/** Props for the NavArrows component. */
export interface NavArrowsProps {
  /** Callback for previous navigation. */
  onPrevious: () => void
  /** Callback for next navigation. */
  onNext: () => void
  /** Title for previous button (e.g., "Previous day"). */
  previousTitle: string
  /** Title for next button (e.g., "Next day"). */
  nextTitle: string
}

/**
 * Fixed-position navigation arrows overlaying the content area.
 *
 * @param props - Navigation callbacks and titles.
 * @returns Left and right arrow buttons.
 */
export function NavArrows({ onPrevious, onNext, previousTitle, nextTitle }: NavArrowsProps) {
  return (
    <>
      <button
        onClick={onPrevious}
        className="fixed left-2 top-1/2 z-50 -translate-y-1/2 cursor-pointer rounded-full border border-transparent bg-white/10 p-2 text-text-faint/10 transition-all hover:border-border hover:bg-white hover:text-text-primary"
        title={previousTitle}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={onNext}
        className="fixed right-2 top-1/2 z-50 -translate-y-1/2 cursor-pointer rounded-full border border-transparent bg-white/10 p-2 text-text-faint/10 transition-all hover:border-border hover:bg-white hover:text-text-primary"
        title={nextTitle}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </>
  )
}
