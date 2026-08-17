import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { YearView } from './YearView'
import type { CalendarEvent, FamilyMember } from '@/types'

const mockMembers: FamilyMember[] = [
  {
    name: 'Faiyaz',
    key: 'faiyaz',
    calendar_id: 'faiyaz@gmail.com',
    color: '#4A90E2',
    initial: 'F',
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

describe('YearView', () => {
  it('renders all 12 month names', () => {
    render(
      <YearView
        currentDate={mockDate}
        events={mockEvents}
        members={mockMembers}
        onMonthClick={vi.fn()}
        onDayClick={vi.fn()}
      />,
    )
    expect(screen.getByText('January')).toBeInTheDocument()
    expect(screen.getByText('August')).toBeInTheDocument()
    expect(screen.getByText('December')).toBeInTheDocument()
  })

  it('highlights the selected month', () => {
    const { container } = render(
      <YearView
        currentDate={mockDate}
        events={mockEvents}
        members={mockMembers}
        onMonthClick={vi.fn()}
        onDayClick={vi.fn()}
      />,
    )
    // August should be the selected month
    const monthCards = container.querySelectorAll('[style*="border"]')
    expect(monthCards.length).toBeGreaterThan(0)
  })

  it('calls onMonthClick when a month is clicked', () => {
    const onMonthClick = vi.fn()
    render(
      <YearView
        currentDate={mockDate}
        events={mockEvents}
        members={mockMembers}
        onMonthClick={onMonthClick}
        onDayClick={vi.fn()}
      />,
    )
    // Click on August (month index 7)
    const augustElement = screen.getByText('August')
    augustElement.closest('div')?.click()
    expect(onMonthClick).toHaveBeenCalledWith(7)
  })

  it('renders day numbers in month grids', () => {
    render(
      <YearView
        currentDate={mockDate}
        events={mockEvents}
        members={mockMembers}
        onMonthClick={vi.fn()}
        onDayClick={vi.fn()}
      />,
    )
    // Day "1" appears in every month grid, so use getAllByText
    const dayOnes = screen.getAllByText('1')
    expect(dayOnes.length).toBeGreaterThan(0)
    // Day "15" appears in multiple months too
    const dayFifteens = screen.getAllByText('15')
    expect(dayFifteens.length).toBeGreaterThan(0)
  })

  it('renders empty year view when no events', () => {
    render(
      <YearView
        currentDate={mockDate}
        events={[]}
        members={mockMembers}
        onMonthClick={vi.fn()}
        onDayClick={vi.fn()}
      />,
    )
    expect(screen.getByText('January')).toBeInTheDocument()
    expect(screen.getByText('August')).toBeInTheDocument()
  })

  it('renders all 12 months in portrait orientation', () => {
    render(
      <YearView
        currentDate={mockDate}
        events={mockEvents}
        members={mockMembers}
        onMonthClick={vi.fn()}
        onDayClick={vi.fn()}
        orientation="portrait"
      />,
    )
    expect(screen.getByText('January')).toBeInTheDocument()
    expect(screen.getByText('December')).toBeInTheDocument()
  })
})
