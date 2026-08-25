/**
 * Shared event card component for calendar views.
 *
 * Renders a colored card with member avatar and optional time display.
 * Supports three size variants for different view contexts:
 * - sm: Month view (compact, border-l-2, small avatar)
 * - md: Week view (standard, border-l-4, shows time)
 * - lg: Day view all-day events (large, border-l-4, no time)
 *
 * Uses palette-based color system — no hardcoded member names.
 */

import { getMemberPaletteKey, paletteBgClasses, paletteBgOpacityClasses, paletteBgHoverClasses, paletteBorderClasses } from '@/shared/utils/memberColors'
import { formatTime } from '@/shared/date/format'
import { isTimedEvent } from '@/types/calendar'
import { useEventPopupContext } from '../../hooks/useEventPopup'
import type { CalendarEvent } from '@/types/calendar'
import type { FamilyMember } from '@/types/family'
import type { PaletteKey } from '@/shared/utils/memberColors'

/** Size variants for event cards. */
export type EventCardSize = 'sm' | 'md' | 'lg'

/** Props for the EventCard component. */
export interface EventCardProps {
  /** The calendar event to display. */
  event: CalendarEvent
  /** Member color map for resolving palette keys. */
  colorMap: Map<string, PaletteKey>
  /** Family members array for resolving initials. */
  members: FamilyMember[]
  /** Card size variant. */
  size?: EventCardSize
  /** Whether to show the time range (for timed events). */
  showTime?: boolean
}

/** Size-specific styling configuration. */
const sizeConfig = {
  sm: {
    container: 'px-1 py-0.5 border-l-2',
    title: 'text-[9px]',
    time: 'text-[8px]',
    avatar: 'h-3 w-3 text-[7px]',
  },
  md: {
    container: 'px-2 py-1 border-l-4',
    title: 'text-xs',
    time: 'text-[10px]',
    avatar: 'h-4 w-4 text-[8px]',
  },
  lg: {
    container: 'px-3 py-1.5 border-l-4',
    title: 'text-sm',
    time: 'text-xs',
    avatar: 'h-5 w-5 text-[10px]',
  },
} as const

/**
 * Event card component for calendar views.
 *
 * @param props - Event data and display configuration.
 * @returns The event card UI.
 */
export function EventCard({
  event,
  colorMap,
  members,
  size = 'md',
  showTime = false,
}: EventCardProps) {
  const { handleMouseEnter, handleMouseMove, handleMouseLeave } = useEventPopupContext()
  const memberKey = event.members[0]
  const paletteKey = getMemberPaletteKey(memberKey, colorMap)
  const member = members.find(m => m.key === memberKey)
  const config = sizeConfig[size]

  return (
    <div
      className={`cursor-pointer rounded-md border-solid ${config.container} ${paletteBorderClasses[paletteKey]} ${paletteBgOpacityClasses[paletteKey]} transition-colors ${paletteBgHoverClasses[paletteKey]}`}
      onMouseEnter={(e) => handleMouseEnter(e, event)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <div className={`truncate font-medium text-text-primary ${config.title}`}>
            {event.title}
          </div>
          {showTime && isTimedEvent(event) && (
            <div className={`${config.time} text-text-muted`}>
              {formatTime(event.start.toPlainTime())} – {formatTime(event.end.toPlainTime())}
            </div>
          )}
        </div>
        <div
          className={`ml-1 flex flex-shrink-0 items-center justify-center rounded-full font-bold leading-none text-white ${config.avatar} ${paletteBgClasses[paletteKey]}`}
        >
          {member?.initial ?? '?'}
        </div>
      </div>
    </div>
  )
}
