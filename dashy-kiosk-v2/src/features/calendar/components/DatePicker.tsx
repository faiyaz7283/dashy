/**
 * Date picker — calendar dropdown for selecting dates.
 *
 * Displays:
 * - Month/year navigation with double arrows (year) and single arrows (month)
 * - ISO 8601 calendar grid (Mon-Sun)
 * - Today highlight (ring)
 * - Selected date highlight (filled background)
 * - Footer: Today button + Close button
 *
 * Width: w-72 (288px), scaled via useUiScale
 */

import { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'
import { today } from '@/shared/date'

/** Props for the DatePicker component. */
export interface DatePickerProps {
  /** Currently selected date. */
  selectedDate: Temporal.PlainDate
  /** Callback when a date is selected. */
  onDateSelect: (date: Temporal.PlainDate) => void
  /** Callback to close the picker. */
  onClose: () => void
}

/**
 * Date picker dropdown for selecting calendar dates.
 *
 * @param props - Date state and callbacks.
 * @returns The date picker UI.
 */
export function DatePicker({ selectedDate, onDateSelect, onClose }: DatePickerProps) {
  const todayDate = today()
  const [viewDate, setViewDate] = useState(selectedDate)

  const year = viewDate.year
  const month = viewDate.month
  const monthName = viewDate.toLocaleString('en-US-u-ca-iso8601', { month: 'long' })

  // Build calendar grid
  const firstOfMonth = Temporal.PlainDate.from({ year, month, day: 1 })
  const daysInMonth = Temporal.PlainDate.from({ year, month: month + 1, day: 1 })
    .subtract({ days: 1 })
    .day

  // Day of week for first of month (1=Mon, 7=Sun)
  const firstDayOfWeek = firstOfMonth.dayOfWeek
  const leadingDays = firstDayOfWeek - 1

  // Previous month days to show
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const daysInPrevMonth = Temporal.PlainDate.from({ year: prevYear, month: prevMonth, day: 1 })
    .subtract({ days: 1 })
    .day

  // Build array of dates to display
  const gridDates: Temporal.PlainDate[] = []

  // Leading days from previous month
  for (let i = leadingDays - 1; i >= 0; i--) {
    gridDates.push(
      Temporal.PlainDate.from({ year: prevYear, month: prevMonth, day: daysInPrevMonth - i }),
    )
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    gridDates.push(Temporal.PlainDate.from({ year, month, day }))
  }

  // Trailing days from next month to fill 6 weeks (42 cells)
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const trailingDays = 42 - gridDates.length
  for (let day = 1; day <= trailingDays; day++) {
    gridDates.push(Temporal.PlainDate.from({ year: nextYear, month: nextMonth, day }))
  }

  const handlePreviousMonth = () => {
    setViewDate(viewDate.subtract({ months: 1 }))
  }

  const handleNextMonth = () => {
    setViewDate(viewDate.add({ months: 1 }))
  }

  const handlePreviousYear = () => {
    setViewDate(viewDate.subtract({ years: 1 }))
  }

  const handleNextYear = () => {
    setViewDate(viewDate.add({ years: 1 }))
  }

  const handleToday = () => {
    setViewDate(todayDate)
    onDateSelect(todayDate)
  }

  const handleDateClick = (date: Temporal.PlainDate) => {
    onDateSelect(date)
  }

  return (
    <div className="w-72 overflow-hidden rounded-xl bg-white shadow-lg ring-1 ring-border">
      {/* Month/Year Navigation */}
      <div className="flex items-center justify-between px-3 pb-2 pt-3">
        <div className="flex items-center gap-0.5">
          <button
            onClick={handlePreviousYear}
            className="rounded-md p-1 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
            title="Previous year"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
          <button
            onClick={handlePreviousMonth}
            className="rounded-md p-1 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
            title="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm font-semibold text-text-primary">{monthName}</span>
          <span className="text-sm font-semibold text-text-primary">{year}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleNextMonth}
            className="rounded-md p-1 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
            title="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={handleNextYear}
            className="rounded-md p-1 text-text-muted transition-colors hover:bg-bg-hover hover:text-text-primary"
            title="Next year"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Day-of-week labels (ISO 8601: Monday first) */}
      <div className="grid grid-cols-7 px-2 pb-1">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((day) => (
          <div key={day} className="py-1 text-center text-[10px] font-medium text-text-faint">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-0.5 px-2 pb-3">
        {gridDates.map((date, idx) => {
          const isCurrentMonth = date.month === month
          const isToday = date.equals(todayDate)
          const isSelected = date.equals(selectedDate)

          let classes = 'h-8 w-8 rounded-md text-xs transition-colors '

          if (isSelected) {
            classes += 'bg-primary font-semibold text-white hover:bg-primary-hover'
          } else if (isToday) {
            classes +=
              'bg-primary-light font-semibold text-primary ring-1 ring-primary-ring hover:bg-primary-light-hover'
          } else if (isCurrentMonth) {
            classes += 'text-text-primary hover:bg-bg-hover'
          } else {
            classes += 'text-text-disabled hover:bg-bg-hover'
          }

          return (
            <button
              key={idx}
              onClick={() => handleDateClick(date)}
              className={classes}
            >
              {date.day}
            </button>
          )
        })}
      </div>

      {/* Footer: Today + Close */}
      <div className="flex items-center justify-between border-t border-border bg-bg/50 px-3 py-2">
        <button
          onClick={handleToday}
          className="text-xs font-medium text-primary transition-colors hover:text-primary-hover"
        >
          Today
        </button>
        <button
          onClick={onClose}
          className="text-xs text-text-muted transition-colors hover:text-text-primary"
        >
          Close
        </button>
      </div>
    </div>
  )
}
