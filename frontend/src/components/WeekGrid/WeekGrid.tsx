import type { CalendarEvent, DailyForecast, FamilyMember } from '../../types'
import { DayCard } from '../DayCard'
import { EventPopup } from '../EventPopup'
import { EventModal } from '../EventModal'
import { spacing } from '../../theme/tokens'
import { themeConfig } from '../../theme/config'
import { getWeekDays, isSameDay } from '../../utils/dateFormat'
import { getRelativeDensity } from '../../utils/density'
import { useEventInteraction } from '../../hooks/useEventInteraction'

interface WeekGridProps {
  events: CalendarEvent[]
  members: FamilyMember[]
  orientation: 'landscape' | 'portrait'
  /** The current date for the week view (used for navigation). */
  currentDate: Date
  /** Callback when a day card is clicked. */
  onDayClick?: (date: Date) => void
  /** Weather forecast data for the next 16 days. */
  weatherForecast?: DailyForecast[]
}

function getEventsForDay(events: CalendarEvent[], date: Date): CalendarEvent[] {
  return events.filter((e) => {
    const eventDate = new Date(e.start)
    return isSameDay(eventDate, date)
  })
}

function getWeatherForDay(
  forecast: DailyForecast[] | undefined,
  date: Date,
): DailyForecast | undefined {
  if (!forecast) return undefined
  // Use local date components to match backend's local timezone date formatting
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return forecast.find((f) => f.date === dateStr)
}

export function WeekGrid({
  events,
  members,
  orientation,
  currentDate,
  onDayClick,
  weatherForecast,
}: WeekGridProps) {
  const {
    popupState,
    selectedEvent,
    handleDayMouseEnter,
    handleMouseMove,
    handleMouseLeave,
    openEvent,
    closeEvent,
  } = useEventInteraction(events)

  const today = new Date()
  const weekDays = getWeekDays(currentDate)
  const nextWeekStart = new Date(weekDays[6])
  nextWeekStart.setDate(nextWeekStart.getDate() + 1)
  const nextWeekEnd = new Date(nextWeekStart)
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 6)

  const cols =
    orientation === 'landscape'
      ? themeConfig.calendar.weekGridLandscape
      : themeConfig.calendar.weekGridPortrait
  const rows = Math.ceil(themeConfig.calendar.weekDaysCount / cols)

  // Calculate event counts for each day to determine density
  const dayCounts = weekDays.map((date) => getEventsForDay(events, date).length)

  return (
    <div onMouseLeave={handleMouseLeave} style={{ height: '100%' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          gap: `${spacing.lg}px`,
          height: '100%',
        }}
      >
        {weekDays.map((date, idx) => (
          <DayCard
            key={date.toISOString()}
            date={date}
            events={getEventsForDay(events, date)}
            members={members}
            isToday={isSameDay(date, today)}
            density={getRelativeDensity(dayCounts[idx], dayCounts)}
            onClick={onDayClick ? () => onDayClick(date) : undefined}
            onEventClick={openEvent}
            onEventMouseEnter={handleDayMouseEnter}
            onEventMouseMove={handleMouseMove}
            onEventMouseLeave={handleMouseLeave}
            weatherForecast={getWeatherForDay(weatherForecast, date)}
          />
        ))}
        <DayCard
          date={nextWeekStart}
          nextWeekEnd={nextWeekEnd}
          events={[]}
          members={members}
          isToday={false}
          isNextWeek
        />
      </div>

      {/* Event popup - key forces full re-render when date changes */}
      {popupState.date && (
        <EventPopup
          key={popupState.date.toISOString()}
          visible={popupState.visible}
          x={popupState.x}
          y={popupState.y}
          dateLabel={popupState.date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
          events={getEventsForDay(events, popupState.date)}
          members={members}
        />
      )}

      {/* Event detail modal */}
      <EventModal
        visible={selectedEvent !== null}
        event={selectedEvent}
        members={members}
        onClose={closeEvent}
      />
    </div>
  )
}
