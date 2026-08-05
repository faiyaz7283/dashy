import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EventCard } from './EventCard'
import type { CalendarEvent, FamilyMember } from '../../types'

const mockMembers: FamilyMember[] = [
  { name: 'Faiyaz', key: 'faiyaz', calendar_id: 'faiyaz@gmail.com', color: '#4A90E2', initial: 'F' },
  { name: 'Trisha', key: 'trisha', calendar_id: 'trisha@gmail.com', color: '#E24A8D', initial: 'T' },
]

const mockEvent: CalendarEvent = {
  id: '1',
  title: 'Team Standup',
  start: '2026-08-04T09:00:00',
  end: '2026-08-04T09:30:00',
  all_day: false,
  members: ['faiyaz'],
}

describe('EventCard', () => {
  it('renders event title', () => {
    render(<EventCard event={mockEvent} members={mockMembers} />)
    expect(screen.getByText('Team Standup')).toBeInTheDocument()
  })

  it('renders event time', () => {
    render(<EventCard event={mockEvent} members={mockMembers} />)
    // Time should be formatted like "9:00 AM – 9:30 AM"
    expect(screen.getByText(/9:00 AM/)).toBeInTheDocument()
  })

  it('renders member initial', () => {
    render(<EventCard event={mockEvent} members={mockMembers} />)
    expect(screen.getByText('F')).toBeInTheDocument()
  })

  it('renders all-day events correctly', () => {
    const allDayEvent: CalendarEvent = {
      ...mockEvent,
      all_day: true,
      start: '2026-08-04T00:00:00',
      end: '2026-08-04T23:59:00',
    }
    render(<EventCard event={allDayEvent} members={mockMembers} />)
    expect(screen.getByText('All day')).toBeInTheDocument()
  })

  it('renders multiple members', () => {
    const multiMemberEvent: CalendarEvent = {
      ...mockEvent,
      members: ['faiyaz', 'trisha'],
    }
    render(<EventCard event={multiMemberEvent} members={mockMembers} />)
    expect(screen.getByText('F')).toBeInTheDocument()
    expect(screen.getByText('T')).toBeInTheDocument()
  })
})
