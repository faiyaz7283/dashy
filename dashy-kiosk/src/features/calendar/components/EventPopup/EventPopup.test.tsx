import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EventPopup } from './EventPopup'
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

const mockEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Team Standup',
    start: '2026-08-08T09:00:00',
    end: '2026-08-08T09:30:00',
    all_day: false,
    members: ['faiyaz'],
  },
]

describe('EventPopup', () => {
  it('renders nothing when not visible', () => {
    const { container } = render(
      <EventPopup
        visible={false}
        x={100}
        y={100}
        dateLabel="Aug 8"
        events={mockEvents}
        members={mockMembers}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when events array is empty', () => {
    const { container } = render(
      <EventPopup
        visible={true}
        x={100}
        y={100}
        dateLabel="Aug 8"
        events={[]}
        members={mockMembers}
      />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders event title and date label when visible', () => {
    render(
      <EventPopup
        visible={true}
        x={100}
        y={100}
        dateLabel="Aug 8"
        events={mockEvents}
        members={mockMembers}
      />,
    )
    expect(screen.getByText('Aug 8')).toBeInTheDocument()
    expect(screen.getByText('Team Standup')).toBeInTheDocument()
  })

  it('renders event time for timed events', () => {
    render(
      <EventPopup
        visible={true}
        x={100}
        y={100}
        dateLabel="Aug 8"
        events={mockEvents}
        members={mockMembers}
      />,
    )
    expect(screen.getByText(/9:00 AM/)).toBeInTheDocument()
  })

  it('renders "All day" for all-day events', () => {
    const allDayEvent: CalendarEvent = {
      ...mockEvents[0]!,
      all_day: true,
      start: '2026-08-08T00:00:00',
      end: '2026-08-08T23:59:00',
    }
    render(
      <EventPopup
        visible={true}
        x={100}
        y={100}
        dateLabel="Aug 8"
        events={[allDayEvent]}
        members={mockMembers}
      />,
    )
    expect(screen.getByText('All day')).toBeInTheDocument()
  })

  it('renders member initials', () => {
    render(
      <EventPopup
        visible={true}
        x={100}
        y={100}
        dateLabel="Aug 8"
        events={mockEvents}
        members={mockMembers}
      />,
    )
    expect(screen.getByText('F')).toBeInTheDocument()
  })

  it('renders multiple events', () => {
    const events: CalendarEvent[] = [
      ...mockEvents,
      {
        id: '2',
        title: 'Lunch Meeting',
        start: '2026-08-08T12:00:00',
        end: '2026-08-08T13:00:00',
        all_day: false,
        members: ['trisha'],
      },
    ]
    render(
      <EventPopup
        visible={true}
        x={100}
        y={100}
        dateLabel="Aug 8"
        events={events}
        members={mockMembers}
      />,
    )
    expect(screen.getByText('Team Standup')).toBeInTheDocument()
    expect(screen.getByText('Lunch Meeting')).toBeInTheDocument()
  })
})
