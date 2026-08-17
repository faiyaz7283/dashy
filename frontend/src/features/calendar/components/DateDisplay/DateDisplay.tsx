/**
 * DateDisplay component for showing the current date with a date picker.
 *
 * Displays a clickable date text that varies by view (day/week/month/year).
 * Clicking opens a DatePicker popup for date selection.
 * Uses the extracted DatePicker component for the calendar UI.
 */

import { useState, useCallback, useRef } from 'react'
import type { CalendarView } from '@/types'
import { colors, radii, layout } from '@/theme/tokens'
import { getWeekDays } from '@/shared/utils/dateFormat'
import { DatePicker } from '@/features/calendar/components/DatePicker'

interface DateDisplayProps {
  /** The current date to display. */
  currentDate: Date
  /** The current calendar view. */
  currentView: CalendarView
  /** Callback when a date is selected. */
  onDateChange: (date: Date) => void
  /** Compact mode (narrow viewports): shrink to content width. */
  compact?: boolean
}

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const shortMonthNames = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]
const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/**
 * Formats the date text based on the current view.
 *
 * @param date - The date to format.
 * @param view - The current view type.
 * @returns Formatted date string.
 */
function formatDateText(date: Date, view: CalendarView): string {
  switch (view) {
    case 'day':
      return `${dayNames[date.getDay()]}, ${shortMonthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
    case 'week': {
      const weekDays = getWeekDays(date)
      const monday = weekDays[0]!
      const sunday = weekDays[6]!
      if (monday.getMonth() === sunday.getMonth()) {
        return `${shortMonthNames[monday.getMonth()]} ${monday.getDate()} – ${sunday.getDate()}, ${monday.getFullYear()}`
      }
      return `${shortMonthNames[monday.getMonth()]} ${monday.getDate()} – ${shortMonthNames[sunday.getMonth()]} ${sunday.getDate()}, ${sunday.getFullYear()}`
    }
    case 'month':
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`
    case 'year':
      return `${date.getFullYear()}`
  }
}

/**
 * DateDisplay component — trigger button for the DatePicker.
 *
 * @param props - Component props.
 * @returns The date display with picker UI.
 */
export function DateDisplay({
  currentDate,
  currentView,
  onDateChange,
  compact = false,
}: DateDisplayProps) {
  const [isOpen, setIsOpen] = useState(false)
  // Viewport rect of the trigger button, captured when the picker opens —
  // the picker portals to document.body and anchors to these coordinates.
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => {
      if (!prev && containerRef.current) {
        setAnchorRect(containerRef.current.getBoundingClientRect())
      }
      return !prev
    })
  }, [])

  const handleClose = useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={handleToggle}
        className="hover-date-trigger"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          background: colors.white,
          border: `1px solid ${colors.border}`,
          borderRadius: `${radii.lg}px`,
          cursor: 'pointer',
          width: compact ? 'auto' : `${layout.dateDisplayWidth}px`,
        }}
      >
        <svg
          style={{ width: '14px', height: '14px', color: colors.textFaint, flexShrink: 0 }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <span
          style={{
            fontSize: '13px',
            fontWeight: 500,
            color: colors.textSecondary,
            whiteSpace: 'nowrap',
            flex: 1,
            textAlign: 'center',
          }}
        >
          {formatDateText(currentDate, currentView)}
        </span>
        <svg
          style={{ width: '12px', height: '12px', color: colors.textFaint, flexShrink: 0 }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <DatePicker
        currentDate={currentDate}
        currentView={currentView}
        onDateChange={onDateChange}
        isOpen={isOpen}
        onClose={handleClose}
        anchorRect={anchorRect}
      />
    </div>
  )
}
