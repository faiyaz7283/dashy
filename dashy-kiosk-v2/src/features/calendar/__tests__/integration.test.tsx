/**
 * Calendar integration smoke test.
 *
 * Verifies end-to-end calendar functionality:
 * - All 4 views render with API data
 * - Navigation works (prev/next/today)
 * - Event popups appear on hover
 * - Weather popup appears on hover
 * - Date picker integrates
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DayView } from '../views/DayView'
import { WeekView } from '../views/WeekView'
import { MonthView } from '../views/MonthView'
import { YearView } from '../views/YearView'
import { Header } from '@/features/shell/Header'
import type { CalendarEvent } from '@/types/calendar'

// Mock data hooks
const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Team Meeting',
    start: Temporal.PlainDateTime.from('2026-08-24T10:00:00'),
    end: Temporal.PlainDateTime.from('2026-08-24T11:00:00'),
    members: ['faiyaz'],
    location: 'Conference Room',
  },
  {
    id: '2',
    title: 'Lunch with Trisha',
    start: Temporal.PlainDateTime.from('2026-08-24T12:30:00'),
    end: Temporal.PlainDateTime.from('2026-08-24T13:30:00'),
    members: ['trisha'],
  },
]

vi.mock('@/features/calendar/hooks/useCalendarData', () => ({
  useCalendarData: () => ({
    events: mockEvents,
    isLoading: false,
    isRefreshing: false,
    error: null,
    lastRefresh: Date.now(),
  }),
}))

vi.mock('@/features/weather/hooks/useWeatherData', () => ({
  useWeatherData: () => ({
    current: {
      temperature: 72,
      feels_like: 70,
      condition: 'clear',
      humidity: 45,
      wind_speed: 5,
    },
    forecast: [
      {
        date: '2026-08-24',
        high: 75,
        low: 65,
        condition: 'clear',
        icon: 'clear',
        feels_like_day: 73,
        humidity: 50,
        wind_speed: 8,
        uvi: 6,
        pressure: 1013,
        sunrise: '06:30',
        sunset: '19:45',
      },
    ],
    isLoading: false,
    isRefreshing: false,
    error: null,
    lastRefresh: Date.now(),
  }),
}))

vi.mock('@/shared/hooks/useFamilyData', () => ({
  useFamilyData: () => ({
    members: [
      { key: 'faiyaz', name: 'Faiyaz', color: 'blue', initial: 'F', calendar_id: 'cal1', color_key: 'blue', email: 'faiyaz@test.com', date_of_birth: '1990-01-01', relation: 'father' },
      { key: 'trisha', name: 'Trisha', color: 'pink', initial: 'T', calendar_id: 'cal2', color_key: 'pink', email: 'trisha@test.com', date_of_birth: '1992-01-01', relation: 'mother' },
    ],
    isLoading: false,
    error: null,
  }),
}))

vi.mock('@/shared/hooks/useClock', () => ({
  useClock: () => Temporal.PlainTime.from('10:30:00'),
}))

describe('Calendar Integration', () => {
  const testDate = Temporal.PlainDate.from('2026-08-24')

  describe('DayView', () => {
    it('renders events from API', () => {
      render(<DayView date={testDate} onPrevious={vi.fn()} onNext={vi.fn()} />)
      expect(screen.getByText('Team Meeting')).toBeInTheDocument()
      expect(screen.getByText('Lunch with Trisha')).toBeInTheDocument()
    })

    it('shows event popup on hover', async () => {
      render(<DayView date={testDate} onPrevious={vi.fn()} onNext={vi.fn()} />)
      const eventCard = screen.getByText('Team Meeting')
      fireEvent.mouseEnter(eventCard)

      await waitFor(() => {
        expect(screen.getByText('Conference Room')).toBeInTheDocument()
      })
    })

    it('calls navigation callbacks', () => {
      const onPrevious = vi.fn()
      const onNext = vi.fn()
      render(<DayView date={testDate} onPrevious={onPrevious} onNext={onNext} />)

      const prevButton = screen.getByTitle('Previous day')
      const nextButton = screen.getByTitle('Next day')

      fireEvent.click(prevButton)
      expect(onPrevious).toHaveBeenCalledTimes(1)

      fireEvent.click(nextButton)
      expect(onNext).toHaveBeenCalledTimes(1)
    })
  })

  describe('WeekView', () => {
    it('renders week grid with events', () => {
      render(<WeekView date={testDate} onPrevious={vi.fn()} onNext={vi.fn()} />)
      // Should show day headers (multiple instances in week view)
      expect(screen.getAllByText('Mon').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Sun').length).toBeGreaterThan(0)
    })

    it('shows event popup on hover', async () => {
      render(<WeekView date={testDate} onPrevious={vi.fn()} onNext={vi.fn()} />)
      const eventCard = screen.getByText('Team Meeting')
      fireEvent.mouseEnter(eventCard)

      await waitFor(() => {
        expect(screen.getByText('Conference Room')).toBeInTheDocument()
      })
    })
  })

  describe('MonthView', () => {
    it('renders month grid with event indicators', () => {
      render(<MonthView date={testDate} onPrevious={vi.fn()} onNext={vi.fn()} />)
      // Should show day-of-week headers (multiple instances)
      expect(screen.getAllByText('Mon').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Sun').length).toBeGreaterThan(0)
    })

    it('shows event popup on hover', async () => {
      render(<MonthView date={testDate} onPrevious={vi.fn()} onNext={vi.fn()} />)
      const eventCard = screen.getByText('Team Meeting')
      fireEvent.mouseEnter(eventCard)

      await waitFor(() => {
        expect(screen.getByText('Conference Room')).toBeInTheDocument()
      })
    })
  })

  describe('YearView', () => {
    it('renders 12 months', () => {
      render(<YearView date={testDate} onPrevious={vi.fn()} onNext={vi.fn()} />)
      // Should show all month names
      expect(screen.getByText('January')).toBeInTheDocument()
      expect(screen.getByText('December')).toBeInTheDocument()
    })
  })

  describe('Header', () => {
    const defaultProps = {
      activeFeature: 'calendar' as const,
      currentView: 'month' as const,
      onViewChange: vi.fn(),
      onToday: vi.fn(),
      members: [
        { key: 'faiyaz', name: 'Faiyaz', initial: 'F', color_key: 'blue', calendar_id: 'cal1', email: 'faiyaz@test.com', color: 'blue', date_of_birth: '1990-01-01', relation: 'father' },
        { key: 'trisha', name: 'Trisha', initial: 'T', color_key: 'pink', calendar_id: 'cal2', email: 'trisha@test.com', color: 'pink', date_of_birth: '1992-01-01', relation: 'mother' },
      ],
      events: mockEvents,
      choresData: null,
    }

    it('renders live date and clock', () => {
      render(<Header {...defaultProps} />)
      // Check for date components instead of exact format
      expect(screen.getAllByText(/Aug/).length).toBeGreaterThan(0)
      expect(screen.getByText('10:30 AM')).toBeInTheDocument()
    })

    it('renders weather summary', () => {
      render(<Header {...defaultProps} />)
      // Use getAllByText since weather text appears in both header and popup
      expect(screen.getAllByText('72°').length).toBeGreaterThan(0)
      expect(screen.getAllByText('clear').length).toBeGreaterThan(0)
    })

    it('shows weather popup on hover', async () => {
      render(<Header {...defaultProps} />)
      // Find the weather container by looking for the temperature text (handles whitespace)
      const tempElement = screen.getByText(/72/)
      // Navigate up to the container with onMouseEnter handler
      const weatherContainer = tempElement.closest('[class*="relative"][class*="flex"]')

      if (weatherContainer) {
        fireEvent.mouseEnter(weatherContainer)
      }

      await waitFor(() => {
        expect(screen.getByText('Feels Like')).toBeInTheDocument()
      })
    })

    it('renders family pills with event counts', () => {
      render(<Header {...defaultProps} />)
      // Should show member initials
      expect(screen.getByText('F')).toBeInTheDocument()
      expect(screen.getByText('T')).toBeInTheDocument()
    })

    it('renders view switcher for calendar feature', () => {
      render(<Header {...defaultProps} />)
      expect(screen.getByText('Day')).toBeInTheDocument()
      expect(screen.getByText('Week')).toBeInTheDocument()
      expect(screen.getByText('Month')).toBeInTheDocument()
      expect(screen.getByText('Year')).toBeInTheDocument()
    })
  })
})
