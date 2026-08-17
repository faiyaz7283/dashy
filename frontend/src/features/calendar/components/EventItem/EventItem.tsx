/**
 * EventItem — core presentational component for a single calendar event.
 *
 * All calendar views delegate event rendering to this component. Variants:
 * - "card"  — week view day cards (md) and day view all-day rows (sm)
 * - "strip" — month view inline event strips
 * - "block" — day view timed timeline blocks (parent positions via `style`)
 *
 * Styles are lifted from the previously duplicated inline renderers
 * (EventCard, MonthView strips, DayView blocks/rows) so visuals are unchanged.
 */

import { useState } from 'react'
import type { CalendarEvent, FamilyMember } from '@/types'
import { colors, radii, spacing, typography, zIndices } from '@/theme/tokens'
import { LOCALE } from '@/theme/config'
import { RecurringIcon } from './RecurringIcon'
import { getMemberColorPalette } from '@/shared/utils/memberColors'

interface EventItemProps {
  /** The event to render. */
  event: CalendarEvent
  /** Family members for resolving member info. */
  members: FamilyMember[]
  /** Layout variant. */
  variant: 'card' | 'strip' | 'block'
  /** Size — "sm" matches day view all-day rows. Card variant only. */
  size?: 'sm' | 'md'
  /** Whether to show the time line. Card variant only. */
  showTime?: boolean
  /** Extra root styles — block variant: parent passes absolute positioning. */
  style?: React.CSSProperties
  /**
   * Click handler. Calls stopPropagation so parent click targets
   * (day cells/cards that navigate) don't also fire.
   */
  onClick?: (event: CalendarEvent) => void
  onMouseEnter?: (e: React.MouseEvent) => void
  onMouseMove?: (e: React.MouseEvent) => void
  onMouseLeave?: (e: React.MouseEvent) => void
}

/**
 * Formats an event's time range (e.g. "9:00 AM – 9:30 AM"), or "All day".
 */
function formatTimeRange(event: CalendarEvent): string {
  if (event.all_day) return 'All day'
  const opts: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true }
  const start = new Date(event.start).toLocaleTimeString(LOCALE, opts)
  const end = new Date(event.end).toLocaleTimeString(LOCALE, opts)
  return `${start} – ${end}`
}

/**
 * EventItem component.
 *
 * @param props - Component props.
 * @returns The event item UI.
 */
export function EventItem({
  event,
  members,
  variant,
  size = 'md',
  showTime = true,
  style,
  onClick,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
}: EventItemProps) {
  const [hovered, setHovered] = useState(false)

  const eventMembers = members.filter((m) => event.members.includes(m.key))
  const primaryMember = eventMembers[0]
  const mc = primaryMember ? getMemberColorPalette(primaryMember.color) : null
  const isRecurring = Boolean(event.is_recurring_instance || event.recurrence_rule)

  const handleClick = (e: React.MouseEvent) => {
    if (!onClick) return
    e.stopPropagation()
    onClick(event)
  }
  const handleMouseEnter = (e: React.MouseEvent) => {
    setHovered(true)
    onMouseEnter?.(e)
  }
  const handleMouseLeave = (e: React.MouseEvent) => {
    setHovered(false)
    onMouseLeave?.(e)
  }

  const avatarSize = variant === 'strip' ? 12 : 18
  const avatarFontSize = variant === 'strip' ? 7 : 9
  const iconSize = variant === 'strip' ? 9 : 11

  const rootStyle: React.CSSProperties = (() => {
    switch (variant) {
      case 'card':
        return {
          borderRadius: `${radii[size === 'sm' ? 'md' : 'lg']}px`,
          padding: size === 'sm' ? '6px 10px' : `${spacing.md}px`,
          background: mc ? mc.bg : colors.bgHover,
          borderLeft: `3px solid ${mc ? mc.avatar : colors.borderDark}`,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'transform 0.15s',
          transform: hovered && size !== 'sm' ? 'scale(1.01)' : 'scale(1)',
        }
      case 'strip':
        return {
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '10px',
          padding: '2px 6px',
          borderRadius: `${radii.sm}px`,
          borderLeft: `2px solid ${mc ? mc.avatar : colors.border}`,
          background: mc ? mc.bg : colors.bgHover,
          color: mc ? mc.text : colors.textMuted,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          cursor: onClick ? 'pointer' : 'default',
        }
      case 'block':
        return {
          borderRadius: `${radii.md}px`,
          padding: '0 10px',
          background: mc ? mc.bg : colors.bgHover,
          borderLeft: `3px solid ${mc ? mc.avatar : colors.border}`,
          cursor: onClick ? 'pointer' : 'default',
          transition: 'transform 0.1s, box-shadow 0.1s',
          transform: hovered ? 'scale(1.01)' : 'scale(1)',
          boxShadow: hovered ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
          zIndex: hovered ? zIndices.eventBlockHover : zIndices.eventBlock,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          ...style,
        }
    }
  })()

  const titleStyle: React.CSSProperties = (() => {
    switch (variant) {
      case 'card':
        return size === 'sm'
          ? {
              fontSize: '13px',
              fontWeight: 500,
              color: mc ? mc.text : colors.textMuted,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }
          : {
              fontSize: `${typography.eventTitle.size}px`,
              fontWeight: typography.eventTitle.weight,
              color: colors.textPrimary,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }
      case 'strip':
        return { overflow: 'hidden', textOverflow: 'ellipsis' }
      case 'block':
        return {
          fontSize: '12px',
          fontWeight: 600,
          color: colors.textPrimary,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          flex: 1,
        }
    }
  })()

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseMove={onMouseMove}
      onMouseLeave={handleMouseLeave}
      style={variant === 'block' ? rootStyle : { ...rootStyle, ...style }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: variant === 'strip' ? '4px' : '6px',
          width: variant === 'block' ? '100%' : undefined,
        }}
      >
        {primaryMember && (
          <span
            style={{
              width: `${avatarSize}px`,
              height: `${avatarSize}px`,
              borderRadius: '50%',
              fontSize: `${avatarFontSize}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.white,
              fontWeight: 600,
              backgroundColor: primaryMember.color,
              flexShrink: 0,
            }}
          >
            {primaryMember.initial}
          </span>
        )}
        <span style={titleStyle}>{event.title}</span>
        {isRecurring && <RecurringIcon size={iconSize} />}
      </div>
      {variant === 'card' && showTime && (
        <div
          style={{
            fontSize: `${typography.eventTime.size}px`,
            color: colors.textMuted,
            marginTop: '2px',
          }}
        >
          {formatTimeRange(event)}
        </div>
      )}
    </div>
  )
}
