/**
 * End-to-end smoke test for the App component.
 *
 * Verifies:
 * - AppShell renders without crashing
 * - Calendar feature renders with month view by default
 * - Header shows current date and live clock
 * - Feature switching works (Calendar ↔ Chores)
 * - Shell components adapt to active feature
 * - Navigation callbacks work
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import App from './App'
import { formatHeaderDate, today } from '@/shared/date'

// Mock data hooks
vi.mock('@/shared/hooks/useFamilyData', () => ({
  useFamilyData: () => ({
    members: [
      { key: 'faiyaz', name: 'Faiyaz', initial: 'F', color_key: 'blue', calendar_id: 'cal1', email: 'faiyaz@test.com', color: 'blue', date_of_birth: '1990-01-01', relation: 'father' },
      { key: 'trisha', name: 'Trisha', initial: 'T', color_key: 'pink', calendar_id: 'cal2', email: 'trisha@test.com', color: 'pink', date_of_birth: '1992-01-01', relation: 'mother' },
    ],
    isLoading: false,
    error: null,
  }),
}))

vi.mock('@/features/calendar/hooks/useCalendarData', () => ({
  useCalendarData: () => ({
    events: [],
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
        date: '2026-08-25',
        high: 75,
        low: 60,
        condition: 'clear',
        icon: 'clear',
      },
    ],
    isLoading: false,
    isRefreshing: false,
    error: null,
    lastRefresh: Date.now(),
  }),
}))

vi.mock('@/features/chores/hooks/useChoresData', () => ({
  useChoresData: () => ({
    data: {
      categories: [],
      tags: [],
      master_chores: [],
      instances: [],
    },
    isLoading: false,
    isRefreshing: false,
    error: null,
    lastRefresh: Date.now(),
  }),
}))

vi.mock('@/shared/hooks/useClock', () => ({
  useClock: () => Temporal.PlainTime.from('18:30:00'),
}))

describe('App', () => {
  it('renders the shell with month calendar view', async () => {
    await waitFor(() => {
      render(<App />)
    })
    // Default view is month — day-of-week headers should be visible
    expect(screen.getByText('Mon')).toBeInTheDocument()
    expect(screen.getByText('Sun')).toBeInTheDocument()
  })

  it('renders header with current date and live clock', async () => {
    await waitFor(() => {
      render(<App />)
    })
    // Header now shows dynamic date (today) and live clock
    const expectedDate = formatHeaderDate(today())
    expect(screen.getByText(expectedDate)).toBeInTheDocument()
    // Clock shows current time in HH:MM format (e.g., "2:30 PM")
    expect(screen.getByText(/\d{1,2}:\d{2}\s?(AM|PM)/)).toBeInTheDocument()
  })

  it('renders sidebar with Calendar and Chores nav items', async () => {
    await waitFor(() => {
      render(<App />)
    })
    expect(screen.getByRole('button', { name: /Calendar/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Chores/i })).toBeInTheDocument()
  })

  it('renders status bar with settings and theme toggle', async () => {
    await waitFor(() => {
      render(<App />)
    })
    expect(screen.getByTitle('Settings')).toBeInTheDocument()
    // Theme toggle button exists
    expect(screen.getByTitle(/Theme:/i)).toBeInTheDocument()
  })

  it('switches from Calendar to Chores feature', async () => {
    await waitFor(() => {
      render(<App />)
    })
    // Initially shows calendar view
    expect(screen.getByText('Mon')).toBeInTheDocument()

    // Click Chores nav item
    const choresNav = screen.getByRole('button', { name: /Chores/i })
    fireEvent.click(choresNav)

    // Should now show chores board (Open Pool column)
    await waitFor(() => {
      expect(screen.getByText('Open Pool')).toBeInTheDocument()
    })
  })

  it('switches back from Chores to Calendar feature', async () => {
    await waitFor(() => {
      render(<App />)
    })
    // Switch to Chores
    fireEvent.click(screen.getByRole('button', { name: /Chores/i }))
    await waitFor(() => {
      expect(screen.getByText('Open Pool')).toBeInTheDocument()
    })

    // Switch back to Calendar
    fireEvent.click(screen.getByRole('button', { name: /Calendar/i }))
    await waitFor(() => {
      expect(screen.getByText('Mon')).toBeInTheDocument()
    })
  })
})
