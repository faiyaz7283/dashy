import type { CalendarEvent, DailyForecast, FamilyMember } from '@/types'
import { DayCard } from '@/features/calendar/components/DayCard'
import { EventPopup } from '@/features/calendar/components/EventPopup'
import { EventModal } from '@/features/calendar/components/EventModal'
import { spacing } from '@/theme/tokens'
import { themeConfig, LOCALE } from '@/theme/config'
import { getWeekDays, isSameDay } from '@/shared/utils/dateFormat'
import { getRelativeDensity } from '@/shared/utils/density'
import { getEventsForDate } from '@/domain/calendar/utils'
import { getWeatherForDate } from '@/domain/weather/utils'
import { useEventInteraction } from '@/features/calendar/hooks/useEventInteraction'

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
  const nextWeekStart = new Date(weekDays[6]!)
  nextWeekStart.setDate(nextWeekStart.getDate() + 1)
  const nextWeekEnd = new Date(nextWeekStart)
  nextWeekEnd.setDate(nextWeekEnd.getDate() + 6)

  const cols =
    orientation === 'landscape'
      ? themeConfig.calendar.weekGridLandscape
      : themeConfig.calendar.weekGridPortrait
  const rows = Math.ceil(themeConfig.calendar.weekDaysCount / cols)

  // Calculate event counts for each day to determine density
  const dayCounts = weekDays.map((date) => getEventsForDate(events, date).length)

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
        {weekDays.map((date, idx) => {
          const dayWeather = getWeatherForDate(weatherForecast, date)
          return (
            <DayCard
              key={date.toISOString()}
              date={date}
              events={getEventsForDate(events, date)}
              members={members}
              isToday={isSameDay(date, today)}
              density={getRelativeDensity(dayCounts[idx]!, dayCounts)}
              {...(onDayClick ? { onClick: () => onDayClick(date) } : {})}
              onEventClick={openEvent}
              onEventMouseEnter={handleDayMouseEnter}
              onEventMouseMove={handleMouseMove}
              onEventMouseLeave={handleMouseLeave}
              {...(dayWeather ? { weatherForecast: dayWeather } : {})}
            />
          )
        })}
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
          dateLabel={popupState.date.toLocaleDateString(LOCALE, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
          events={getEventsForDate(events, popupState.date)}
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
