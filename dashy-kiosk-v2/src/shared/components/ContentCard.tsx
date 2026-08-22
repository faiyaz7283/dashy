/**
 * Content card wrapper — standardized container for feature views.
 *
 * Provides the Catalyst UI pattern: rounded white card with shadow and ring border.
 * Used by all calendar views (day/week/month/year) and chores board.
 *
 * Pattern: outer `p-2 bg-bg`, inner `rounded-lg bg-white shadow-xs ring-1 ring-border overflow-hidden flex flex-col`
 */

import type { ReactNode } from 'react'

/** Props for the ContentCard component. */
export interface ContentCardProps {
  /** Content to render inside the card. */
  children: ReactNode
  /** Additional CSS classes for the outer wrapper. */
  className?: string
}

/**
 * Standardized content card container.
 *
 * @param props - Card content and optional className.
 * @returns The wrapped content in a Catalyst-style card.
 */
export function ContentCard({ children, className = '' }: ContentCardProps) {
  return (
    <div className={`flex h-full w-full flex-col p-2 ${className}`}>
      <div className="flex grow flex-col overflow-hidden rounded-lg bg-white shadow-xs ring-1 ring-border">
        {children}
      </div>
    </div>
  )
}
