/**
 * DateDisplay component for showing the current date with a date picker.
 *
 * Displays a clickable date text that varies by view (day/week/month/year).
 * Clicking opens a calendar picker popup with month/year navigation.
 * In week view, the entire week is highlighted.
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import type { CalendarView } from '../../types'
import { colors, spacing, radii, layout, shadows, zIndices } from '../../theme/tokens'
import { getWeekDays, isSameDay } from '../../utils/dateFormat'

interface DateDisplayProps {
  /** The current date to display. */
  currentDate: Date
  /** The current calendar view. */
  currentView: CalendarView
  /** Callback when a date is selected. */
  onDateChange: (date: Date) => void
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
 */
function formatDateText(date: Date, view: CalendarView): string {
  switch (view) {
    case 'day':
      return `${dayNames[date.getDay()]}, ${shortMonthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
    case 'week': {
      const weekDays = getWeekDays(date)
      const monday = weekDays[0]
      const sunday = weekDays[6]
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
 * Gets the days to display in a calendar month grid.
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
    const lastDate = days[days.length - 1].date
    const next = new Date(lastDate)
    next.setDate(next.getDate() + 1)
    days.push({ day: next.getDate(), date: next, otherMonth: true })
  }

  return days
}

/**
 * DateDisplay component.
 *
 * @param props - Component props.
 * @returns The date display with picker UI.
 */
export function DateDisplay({ currentDate, currentView, onDateChange }: DateDisplayProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [pickerMonth, setPickerMonth] = useState({
    year: currentDate.getFullYear(),
    month: currentDate.getMonth(),
  })
  const containerRef = useRef<HTMLDivElement>(null)
  const today = new Date()

  // Close picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Sync picker month with current date when it changes
  useEffect(() => {
    setPickerMonth({ year: currentDate.getFullYear(), month: currentDate.getMonth() })
  }, [currentDate])

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev)
  }, [])

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
      setIsOpen(false)
    },
    [onDateChange],
  )

  const days = getCalendarDays(pickerMonth.year, pickerMonth.month)
  const weekDays = currentView === 'week' ? getWeekDays(currentDate) : null

  // Determine if a date is in the selected week (for week view highlighting)
  const isInSelectedWeek = (date: Date): boolean => {
    if (!weekDays) return false
    return weekDays.some((d) => isSameDay(d, date))
  }

  // Get the selected date's position in the week for rounded corners
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

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={handleToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          background: colors.white,
          border: `1px solid ${colors.border}`,
          borderRadius: `${radii.lg}px`,
          cursor: 'pointer',
          transition: 'all 0.15s',
          width: `${layout.dateDisplayWidth}px`,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = colors.borderDark
          e.currentTarget.style.background = colors.bg
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = colors.border
          e.currentTarget.style.background = colors.white
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

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            background: colors.white,
            border: `1px solid ${colors.border}`,
            borderRadius: `${radii.xl}px`,
            boxShadow: shadows.popup,
            padding: `${spacing.lg}px`,
            zIndex: zIndices.popup,
            minWidth: '280px',
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.bgHover
                  e.currentTarget.style.color = colors.textMuted
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = colors.textFaint
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.bgHover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.bgHover
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
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
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = colors.bgHover
                  e.currentTarget.style.color = colors.textMuted
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent'
                  e.currentTarget.style.color = colors.textFaint
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
              let textColor: string = dayData.otherMonth
                ? colors.textDisabled
                : colors.textSecondary
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

              return (
                <button
                  key={idx}
                  onClick={() => handleDayClick(dayData.date)}
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
                    transition: 'all 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !dayData.otherMonth) {
                      e.currentTarget.style.background = colors.bgHover
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent'
                    }
                  }}
                >
                  {dayData.day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
