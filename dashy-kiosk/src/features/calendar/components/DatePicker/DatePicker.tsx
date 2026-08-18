/**
 * DatePicker component for selecting dates via a calendar popup.
 *
 * Displays a month grid with navigation controls. Supports week highlighting
 * in week view. Portaled to document.body to escape overflow clipping.
 * Extracted from DateDisplay to separate picker logic from the trigger button.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { CalendarView } from '@/types'
import { colors, spacing, radii, shadows, zIndices } from '@/theme/tokens'
import { getWeekDays, isSameDay } from '@/shared/utils/dateFormat'
import { useUiScale } from '@/features/kiosk/hooks/useUiScale'

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

interface DatePickerProps {
  /** The currently selected date. */
  currentDate: Date
  /** The active calendar view (affects week highlighting). */
  currentView: CalendarView
  /** Callback when a date is selected. */
  onDateChange: (date: Date) => void
  /** Whether the picker is open. */
  isOpen: boolean
  /** Callback to close the picker. */
  onClose: () => void
  /** The anchor element rect for positioning. */
  anchorRect: DOMRect | null
}

/**
 * Gets the days to display in a calendar month grid.
 *
 * @param year - The year.
 * @param month - The month (0-11).
 * @returns Array of day objects with date and otherMonth flag.
 */
function getCalendarDays(
  year: number,
  month: number,
): Array<{ day: number; date: Date; otherMonth: boolean }> {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = firstDay.getDay()
  const paddingStart = startDow === 0 ? 6 : startDow - 1

  const days: Array<{ day: number; date: Date; otherMonth: boolean }> = []

  // Leading days from previous month
  for (let i = paddingStart; i > 0; i--) {
    const d = new Date(year, month, 1 - i)
    days.push({ day: d.getDate(), date: d, otherMonth: true })
  }

  // Current month days
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push({ day: d, date: new Date(year, month, d), otherMonth: false })
  }

  // Trailing days to fill complete weeks
  while (days.length % 7 !== 0) {
    const lastDate = days[days.length - 1]!.date
    const next = new Date(lastDate)
    next.setDate(next.getDate() + 1)
    days.push({ day: next.getDate(), date: next, otherMonth: true })
  }

  return days
}

/**
 * DatePicker component — calendar popup for date selection.
 *
 * @param props - Component props.
 * @returns The date picker UI (portaled to body).
 */
export function DatePicker({
  currentDate,
  currentView,
  onDateChange,
  isOpen,
  onClose,
  anchorRect,
}: DatePickerProps) {
  const [pickerMonth, setPickerMonth] = useState({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth(),
  })
  const pickerRef = useRef<HTMLDivElement>(null)
  const scale = useUiScale()
  const today = new Date()

  // Close picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (pickerRef.current?.contains(target)) {
        return
      }
      onClose()
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  // Sync picker month with current date when it changes
  useEffect(() => {
    setPickerMonth({ year: currentDate.getFullYear(), month: currentDate.getMonth() })
  }, [currentDate])

  const handlePrevMonth = useCallback(() => {
    setPickerMonth((prev) => {
      const newMonth = prev.month - 1
      if (newMonth < 0) return { year: prev.year - 1, month: 11 }
      return { ...prev, month: newMonth }
    })
  }, [])

  const handleNextMonth = useCallback(() => {
    setPickerMonth((prev) => {
      const newMonth = prev.month + 1
      if (newMonth > 11) return { year: prev.year + 1, month: 0 }
      return { ...prev, month: newMonth }
    })
  }, [])

  const handlePrevYear = useCallback(() => {
    setPickerMonth((prev) => ({ ...prev, year: prev.year - 1 }))
  }, [])

  const handleNextYear = useCallback(() => {
    setPickerMonth((prev) => ({ ...prev, year: prev.year + 1 }))
  }, [])

  const handleDayClick = useCallback(
    (date: Date) => {
      onDateChange(date)
      onClose()
    },
    [onDateChange, onClose],
  )

  const days = getCalendarDays(pickerMonth.year, pickerMonth.month)
  const weekDays = currentView === 'week' ? getWeekDays(currentDate) : null

  /**
   * Checks if a date is in the selected week (for week view highlighting).
   */
  const isInSelectedWeek = (date: Date): boolean => {
    if (!weekDays) return false
    return weekDays.some((d) => isSameDay(d, date))
  }

  /**
   * Gets the border radius for a date in week view (rounded corners).
   */
  const getWeekBorderRadius = (date: Date): string => {
    if (!weekDays) return '6px'
    const idx = weekDays.findIndex((d) => isSameDay(d, date))
    if (idx === 0) return '6px 0 0 6px'
    if (idx === 6) return '0 6px 6px 0'
    if (idx > 0) return '0'
    return '6px'
  }

  const isDateSelected = (date: Date): boolean => isSameDay(date, currentDate)
  const isDateToday = (date: Date): boolean => isSameDay(date, today)

  if (!isOpen || !anchorRect) {
    return null
  }

  return createPortal(
    <div
      ref={pickerRef}
      style={{
        position: 'fixed',
        top: `${anchorRect.bottom + 8}px`,
        right: `${window.innerWidth - anchorRect.right}px`,
        zIndex: zIndices.popup,
      }}
    >
      <div
        style={{
          background: colors.white,
          border: `1px solid ${colors.border}`,
          borderRadius: `${radii.xl}px`,
          boxShadow: shadows.popup,
          padding: `${spacing.lg}px`,
          minWidth: '280px',
          zoom: scale,
        }}
      >
        {/* Header with navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <button
              onClick={handlePrevYear}
              title="Previous year"
              className="hover-picker-btn"
              style={{
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: colors.textFaint,
              }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 19l-7-7 7-7M18 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={handlePrevMonth}
              title="Previous month"
              className="hover-picker-month"
              style={{
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: colors.textMuted,
              }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          </div>
          <span style={{ fontSize: '14px', fontWeight: 600, color: colors.textPrimary }}>
            {monthNames[pickerMonth.month]} {pickerMonth.year}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            <button
              onClick={handleNextMonth}
              title="Next month"
              className="hover-picker-month"
              style={{
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: colors.textMuted,
              }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <button
              onClick={handleNextYear}
              title="Next year"
              className="hover-picker-btn"
              style={{
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '6px',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: colors.textFaint,
              }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 5l7 7-7 7M6 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '2px',
            marginBottom: '4px',
          }}
        >
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
            <div
              key={d}
              style={{
                textAlign: 'center',
                fontSize: '11px',
                fontWeight: 500,
                color: colors.textFaint,
                padding: '4px',
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
          {days.map((dayData, idx) => {
            const isSelected = isDateSelected(dayData.date)
            const isToday = isDateToday(dayData.date)
            const inWeek = isInSelectedWeek(dayData.date)
            const isPast = dayData.date < today && !isToday
            const isFuture = dayData.date > today && !isToday

            let background: string = 'transparent'
            let textColor: string = dayData.otherMonth ? colors.textDisabled : colors.textSecondary
            let fontWeight = 400
            let borderRadius = '6px'

            if (inWeek && currentView === 'week') {
              borderRadius = getWeekBorderRadius(dayData.date)
              if (isToday) {
                background = colors.primary
                textColor = colors.white
                fontWeight = 600
              } else if (isPast) {
                background = colors.bgHover
                textColor = colors.textMuted
              } else if (isFuture) {
                background = '#dbeafe'
                textColor = '#1e40af'
              }
            }

            if (isSelected) {
              if (inWeek && currentView === 'week') {
                // Selected date in week view gets a border
                fontWeight = 700
              } else if (isToday) {
                background = colors.primary
                textColor = colors.white
                fontWeight = 600
              } else {
                background = colors.primaryLight
                textColor = colors.primary
                fontWeight = 600
              }
            }

            const canHover = !isSelected && !dayData.otherMonth

            return (
              <button
                key={idx}
                onClick={() => handleDayClick(dayData.date)}
                className={canHover ? 'hover-bg' : ''}
                style={{
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  borderRadius,
                  cursor: 'pointer',
                  color: textColor,
                  background,
                  border:
                    isSelected && inWeek && currentView === 'week'
                      ? `2px solid ${colors.primary}`
                      : 'none',
                  fontWeight,
                }}
              >
                {dayData.day}
              </button>
            )
          })}
        </div>
      </div>
    </div>,
    document.body,
  )
}
