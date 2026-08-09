import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { DayView } from './DayView'
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

const mockDate = new Date('2026-08-08T12:00:00')

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Morning Meeting',
    start: '2026-08-08T09:00:00',
    end: '2026-08-08T10:00:00',
    all_day: false,
    members: ['faiyaz'],
  },
  {
    id: '2',
    title: 'Ninja Warrior',
    start: '2026-08-08T00:00:00',
    end: '2026-08-08T23:59:00',
    all_day: true,
    members: ['faiyaz'],
  },
]

describe('DayView', () => {
  it('renders the timeline with hour labels', () => {
    render(<DayView currentDate={mockDate} events={[]} members={mockMembers} />)
    // Should show 12 AM and other hour labels
    expect(screen.getByText('12 AM')).toBeInTheDocument()
    expect(screen.getByText('1 PM')).toBeInTheDocument()
  })

  it('renders all-day events section when all-day events exist', () => {
    render(<DayView currentDate={mockDate} events={mockEvents} members={mockMembers} />)
    expect(screen.getByText('All-day')).toBeInTheDocument()
    expect(screen.getByText('Ninja Warrior')).toBeInTheDocument()
  })

  it('does not render all-day section when no all-day events', () => {
    const timedOnly = mockEvents.filter((e) => !e.all_day)
    render(<DayView currentDate={mockDate} events={timedOnly} members={mockMembers} />)
    expect(screen.queryByText('All-day')).not.toBeInTheDocument()
  })

  it('renders timed events', () => {
    render(<DayView currentDate={mockDate} events={mockEvents} members={mockMembers} />)
    expect(screen.getByText('Morning Meeting')).toBeInTheDocument()
  })

  it('shows member initials on events', () => {
    render(<DayView currentDate={mockDate} events={mockEvents} members={mockMembers} />)
    // Should show member initial 'F' for Faiyaz
    const initials = screen.getAllByText('F')
    expect(initials.length).toBeGreaterThan(0)
  })

  it('renders empty timeline when no events', () => {
    render(<DayView currentDate={mockDate} events={[]} members={mockMembers} />)
    expect(screen.getByText('12 AM')).toBeInTheDocument()
    expect(screen.queryByText('Morning Meeting')).not.toBeInTheDocument()
  })
})
