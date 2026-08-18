import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { EventModal } from './EventModal'
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

const mockEvent: CalendarEvent = {
  id: '1',
  title: 'Team Standup',
  start: '2026-08-10T09:00:00',
  end: '2026-08-10T09:30:00',
  all_day: false,
  members: ['faiyaz'],
}

function renderModal(event: CalendarEvent | null, onClose = vi.fn()) {
  return render(
    <EventModal visible={event !== null} event={event} members={mockMembers} onClose={onClose} />,
  )
}

describe('EventModal', () => {
  it('renders nothing when not visible', () => {
    const { container } = renderModal(null)
    expect(container.firstChild).toBeNull()
  })

  it('renders the event title and owner', () => {
    renderModal(mockEvent)
    expect(screen.getByRole('heading', { name: 'Team Standup' })).toBeInTheDocument()
    expect(screen.getByText('Owner')).toBeInTheDocument()
    expect(screen.getByText('Faiyaz')).toBeInTheDocument()
  })

  it('calls onClose when the close button is clicked', () => {
    const onClose = vi.fn()
    renderModal(mockEvent, onClose)
    fireEvent.click(screen.getByText('×'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('shows the description when present', () => {
    renderModal({ ...mockEvent, description: 'Bring snacks' })
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(screen.getByText('Bring snacks')).toBeInTheDocument()
  })

  it('hides the description section when absent', () => {
    renderModal(mockEvent)
    expect(screen.queryByText('Description')).not.toBeInTheDocument()
  })

  it('shows a humanized recurrence rule for recurring events', () => {
    renderModal({
      ...mockEvent,
      is_recurring_instance: true,
      recurrence_rule: 'RRULE:FREQ=WEEKLY;BYDAY=MO,WE',
    })
    expect(screen.getByText('Repeats')).toBeInTheDocument()
    expect(screen.getByText('Weekly on Mon, Wed')).toBeInTheDocument()
  })

  it('shows a generic label for recurring events without a rule', () => {
    renderModal({ ...mockEvent, is_recurring_instance: true })
    expect(screen.getByText('Recurring event')).toBeInTheDocument()
  })

  it('shows attendees with RSVP status when attendee data exists', () => {
    renderModal({
      ...mockEvent,
      members: ['faiyaz', 'trisha'],
      attendees: [
        {
          member_key: 'faiyaz',
          email: 'faiyaz@gmail.com',
          display_name: 'Faiyaz',
          status: 'accepted',
          color: '#4A90E2',
        },
        {
          member_key: 'trisha',
          email: 'trisha@gmail.com',
          display_name: 'Trisha',
          status: 'declined',
          color: '#E24A8D',
        },
        {
          member_key: null,
          email: 'guest@example.com',
          display_name: 'Greg Guest',
          status: 'needsAction',
          color: '#9ca3af',
        },
      ],
    })
    expect(screen.getByText('Attendees')).toBeInTheDocument()
    expect(screen.getByText('Accepted')).toBeInTheDocument()
    expect(screen.getByText('Declined')).toBeInTheDocument()
    expect(screen.getByText('No response')).toBeInTheDocument()
    expect(screen.getByText('Greg Guest')).toBeInTheDocument()
    // Guests fallback should not render when attendees exist
    expect(screen.queryByText('Guests')).not.toBeInTheDocument()
  })

  it('falls back to member guests when no attendee data', () => {
    renderModal({ ...mockEvent, members: ['faiyaz', 'trisha'] })
    expect(screen.getByText('Guests')).toBeInTheDocument()
    expect(screen.queryByText('Attendees')).not.toBeInTheDocument()
  })

  it('uses the organizer as owner when set', () => {
    renderModal({ ...mockEvent, members: ['faiyaz', 'trisha'], organizer: 'trisha' })
    const ownerSection = screen.getByText('Owner').parentElement as HTMLElement
    expect(ownerSection).toHaveTextContent('Trisha')
  })
})
