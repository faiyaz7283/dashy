import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { WeekGrid } from './WeekGrid'
import type { CalendarEvent, FamilyMember } from '../../types'

const mockMembers: FamilyMember[] = [
  {
    name: 'Faiyaz',
    key: 'faiyaz',
    calendar_id: 'faiyaz@gmail.com',
    color: '#4A90E2',
    initial: 'F',
  },
  {
    name: 'Trisha',
    key: 'trisha',
    calendar_id: 'trisha@gmail.com',
    color: '#E24A8D',
    initial: 'T',
  },
]

const mockDate = new Date('2026-08-10T12:00:00') // Monday

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Team Standup',
    start: '2026-08-10T09:00:00',
    end: '2026-08-10T09:30:00',
    all_day: false,
    members: ['faiyaz'],
  },
  {
    id: '2',
    title: 'Lunch Meeting',
    start: '2026-08-12T12:00:00',
    end: '2026-08-12T13:00:00',
    all_day: false,
    members: ['trisha'],
  },
]

describe('WeekGrid', () => {
  it('renders 7 day cards plus next week card', () => {
    const { container } = render(
      <WeekGrid
        events={mockEvents}
        members={mockMembers}
        orientation="landscape"
        currentDate={mockDate}
        onDayClick={vi.fn()}
      />,
    )
    // Should have 8 DayCard divs (7 days + 1 next week)
    const cards = container.querySelectorAll('[style*="border-radius"]')
    expect(cards.length).toBeGreaterThanOrEqual(8)
  })

  it('renders event titles in day cards', () => {
    render(
      <WeekGrid
        events={mockEvents}
        members={mockMembers}
        orientation="landscape"
        currentDate={mockDate}
        onDayClick={vi.fn()}
      />,
    )
    expect(screen.getByText('Team Standup')).toBeInTheDocument()
    expect(screen.getByText('Lunch Meeting')).toBeInTheDocument()
  })

  it('calls onDayClick when a day card (not an event) is clicked', () => {
    const onDayClick = vi.fn()
    render(
      <WeekGrid
        events={mockEvents}
        members={mockMembers}
        orientation="landscape"
        currentDate={mockDate}
        onDayClick={onDayClick}
      />,
    )
    // Click the day header (weekday name) — outside any event
    screen.getByText('Mon').click()
    expect(onDayClick).toHaveBeenCalled()
  })

  it('opens the event modal when an event is clicked instead of navigating', () => {
    const onDayClick = vi.fn()
    render(
      <WeekGrid
        events={mockEvents}
        members={mockMembers}
        orientation="landscape"
        currentDate={mockDate}
        onDayClick={onDayClick}
      />,
    )
    fireEvent.click(screen.getByText('Team Standup'))
    expect(onDayClick).not.toHaveBeenCalled()
    // Modal shows the event title in a heading
    expect(screen.getByRole('heading', { name: 'Team Standup' })).toBeInTheDocument()
  })

  it('renders with portrait orientation', () => {
    const { container } = render(
      <WeekGrid
        events={mockEvents}
        members={mockMembers}
        orientation="portrait"
        currentDate={mockDate}
        onDayClick={vi.fn()}
      />,
    )
    expect(container.firstChild).toBeInTheDocument()
  })

  it('renders empty week when no events', () => {
    render(
      <WeekGrid
        events={[]}
        members={mockMembers}
        orientation="landscape"
        currentDate={mockDate}
        onDayClick={vi.fn()}
      />,
    )
    expect(screen.queryByText('Team Standup')).not.toBeInTheDocument()
  })

  it('renders member initials on events', () => {
    render(
      <WeekGrid
        events={mockEvents}
        members={mockMembers}
        orientation="landscape"
        currentDate={mockDate}
        onDayClick={vi.fn()}
      />,
    )
    const initials = screen.getAllByText('F')
    expect(initials.length).toBeGreaterThan(0)
  })
})
