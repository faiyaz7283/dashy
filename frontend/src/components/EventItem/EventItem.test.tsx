import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { EventItem } from './EventItem'
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

const mockEvent: CalendarEvent = {
  id: '1',
  title: 'Team Standup',
  start: '2026-08-04T09:00:00',
  end: '2026-08-04T09:30:00',
  all_day: false,
  members: ['faiyaz'],
}

describe('EventItem', () => {
  describe('card variant', () => {
    it('renders event title', () => {
      render(<EventItem event={mockEvent} members={mockMembers} variant="card" />)
      expect(screen.getByText('Team Standup')).toBeInTheDocument()
    })

    it('renders event time', () => {
      render(<EventItem event={mockEvent} members={mockMembers} variant="card" />)
      expect(screen.getByText(/9:00 AM/)).toBeInTheDocument()
    })

    it('renders member initial', () => {
      render(<EventItem event={mockEvent} members={mockMembers} variant="card" />)
      expect(screen.getByText('F')).toBeInTheDocument()
    })

    it('renders all-day events correctly', () => {
      const allDayEvent: CalendarEvent = { ...mockEvent, all_day: true }
      render(<EventItem event={allDayEvent} members={mockMembers} variant="card" />)
      expect(screen.getByText('All day')).toBeInTheDocument()
    })

    it('hides the time line when showTime is false', () => {
      render(
        <EventItem
          event={mockEvent}
          members={mockMembers}
          variant="card"
          size="sm"
          showTime={false}
        />,
      )
      expect(screen.queryByText(/9:00 AM/)).not.toBeInTheDocument()
    })
  })

  describe('strip variant', () => {
    it('renders title and avatar but no time line', () => {
      render(<EventItem event={mockEvent} members={mockMembers} variant="strip" />)
      expect(screen.getByText('Team Standup')).toBeInTheDocument()
      expect(screen.getByText('F')).toBeInTheDocument()
      expect(screen.queryByText(/9:00 AM/)).not.toBeInTheDocument()
    })
  })

  describe('block variant', () => {
    it('renders title and avatar', () => {
      render(<EventItem event={mockEvent} members={mockMembers} variant="block" />)
      expect(screen.getByText('Team Standup')).toBeInTheDocument()
      expect(screen.getByText('F')).toBeInTheDocument()
    })
  })

  describe('recurring indicator', () => {
    it('shows recurring icon for recurring instances', () => {
      const recurring: CalendarEvent = { ...mockEvent, is_recurring_instance: true }
      render(<EventItem event={recurring} members={mockMembers} variant="card" />)
      expect(screen.getByTitle('Recurring event')).toBeInTheDocument()
    })

    it('shows recurring icon when a recurrence rule is present', () => {
      const recurring: CalendarEvent = {
        ...mockEvent,
        recurrence_rule: 'RRULE:FREQ=WEEKLY;BYDAY=MO',
      }
      render(<EventItem event={recurring} members={mockMembers} variant="card" />)
      expect(screen.getByTitle('Recurring event')).toBeInTheDocument()
    })

    it('does not show recurring icon for one-off events', () => {
      render(<EventItem event={mockEvent} members={mockMembers} variant="card" />)
      expect(screen.queryByTitle('Recurring event')).not.toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('calls onClick with the event', () => {
      const onClick = vi.fn()
      render(<EventItem event={mockEvent} members={mockMembers} variant="card" onClick={onClick} />)
      fireEvent.click(screen.getByText('Team Standup'))
      expect(onClick).toHaveBeenCalledWith(mockEvent)
    })

    it('stops click propagation so parent click targets do not fire', () => {
      const onParentClick = vi.fn()
      const onClick = vi.fn()
      render(
        <div onClick={onParentClick}>
          <EventItem event={mockEvent} members={mockMembers} variant="card" onClick={onClick} />
        </div>,
      )
      fireEvent.click(screen.getByText('Team Standup'))
      expect(onClick).toHaveBeenCalledTimes(1)
      expect(onParentClick).not.toHaveBeenCalled()
    })

    it('forwards hover handlers to the parent', () => {
      const onMouseEnter = vi.fn()
      const onMouseLeave = vi.fn()
      render(
        <EventItem
          event={mockEvent}
          members={mockMembers}
          variant="card"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        />,
      )
      const title = screen.getByText('Team Standup')
      fireEvent.mouseEnter(title)
      fireEvent.mouseLeave(title)
      expect(onMouseEnter).toHaveBeenCalledTimes(1)
      expect(onMouseLeave).toHaveBeenCalledTimes(1)
    })
  })
})
