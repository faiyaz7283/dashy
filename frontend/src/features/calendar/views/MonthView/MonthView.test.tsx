import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MonthView } from './MonthView'
import type { CalendarEvent, FamilyMember } from '@/types'

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

const mockDate = new Date('2026-08-15T12:00:00') // August 2026

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
    title: 'Birthday Party',
    start: '2026-08-20T00:00:00',
    end: '2026-08-20T23:59:00',
    all_day: true,
    members: ['faiyaz'],
  },
]

describe('MonthView', () => {
  it('renders weekday headers', () => {
    render(
      <MonthView
        currentDate={mockDate}
        events={mockEvents}
        members={mockMembers}
        onDayClick={vi.fn()}
      />,
    )
    expect(screen.getByText('Mon')).toBeInTheDocument()
    expect(screen.getByText('Tue')).toBeInTheDocument()
    expect(screen.getByText('Sun')).toBeInTheDocument()
  })

  it('renders day numbers in the grid', () => {
    render(
      <MonthView
        currentDate={mockDate}
        events={mockEvents}
        members={mockMembers}
        onDayClick={vi.fn()}
      />,
    )
    // Day 15 should be present (August 15)
    const dayFifteens = screen.getAllByText('15')
    expect(dayFifteens.length).toBeGreaterThan(0)
  })

  it('renders event titles for days with events', () => {
    render(
      <MonthView
        currentDate={mockDate}
        events={mockEvents}
        members={mockMembers}
        onDayClick={vi.fn()}
      />,
    )
    expect(screen.getByText('Team Standup')).toBeInTheDocument()
    expect(screen.getByText('Birthday Party')).toBeInTheDocument()
  })

  it('shows event count badge on days with events', () => {
    render(
      <MonthView
        currentDate={mockDate}
        events={mockEvents}
        members={mockMembers}
        onDayClick={vi.fn()}
      />,
    )
    // Badge should show "1" for days with 1 event
    const badges = screen.getAllByText('1')
    expect(badges.length).toBeGreaterThan(0)
  })

  it('calls onDayClick when a day is clicked', () => {
    const onDayClick = vi.fn()
    render(
      <MonthView
        currentDate={mockDate}
        events={mockEvents}
        members={mockMembers}
        onDayClick={onDayClick}
      />,
    )
    // Click on the day with "15"
    const dayFifteens = screen.getAllByText('15')
    dayFifteens[0]!.closest('div')?.click()
    expect(onDayClick).toHaveBeenCalled()
  })

  it('opens the event modal when an event strip is clicked instead of navigating', () => {
    const onDayClick = vi.fn()
    render(
      <MonthView
        currentDate={mockDate}
        events={mockEvents}
        members={mockMembers}
        onDayClick={onDayClick}
      />,
    )
    fireEvent.click(screen.getByText('Team Standup'))
    expect(onDayClick).not.toHaveBeenCalled()
    // Modal shows the event title in a heading
    expect(screen.getByRole('heading', { name: 'Team Standup' })).toBeInTheDocument()
  })

  it('renders empty month when no events', () => {
    render(
      <MonthView currentDate={mockDate} events={[]} members={mockMembers} onDayClick={vi.fn()} />,
    )
    expect(screen.getByText('Mon')).toBeInTheDocument()
    expect(screen.queryByText('Team Standup')).not.toBeInTheDocument()
  })

  it('renders member initials on events', () => {
    render(
      <MonthView
        currentDate={mockDate}
        events={mockEvents}
        members={mockMembers}
        onDayClick={vi.fn()}
      />,
    )
    const initials = screen.getAllByText('F')
    expect(initials.length).toBeGreaterThan(0)
  })
})
