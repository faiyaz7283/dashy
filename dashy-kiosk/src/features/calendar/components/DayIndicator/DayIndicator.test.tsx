import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { DayIndicator } from './DayIndicator'
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

function makeEvent(id: string, members: string[]): CalendarEvent {
  return {
    id,
    title: `Event ${id}`,
    start: '2026-08-10T09:00:00',
    end: '2026-08-10T10:00:00',
    all_day: false,
    members,
  }
}

/** Renders and returns the indicator bar element. */
function renderBar(events: CalendarEvent[]): HTMLElement {
  const { container } = render(<DayIndicator events={events} members={mockMembers} />)
  return container.firstChild as HTMLElement
}

describe('DayIndicator', () => {
  it('renders nothing when the day has no events', () => {
    const { container } = render(<DayIndicator events={[]} members={mockMembers} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders one segment per event, colored by primary member', () => {
    const bar = renderBar([makeEvent('1', ['faiyaz']), makeEvent('2', ['trisha'])])
    const segments = bar.querySelectorAll('span')
    expect(segments).toHaveLength(2)
    expect(segments[0]).toHaveStyle('background: #4A90E2')
    expect(segments[1]).toHaveStyle('background: #E24A8D')
  })

  it('falls back to a neutral color when the member is unknown', () => {
    const bar = renderBar([makeEvent('1', ['unknown'])])
    const segments = bar.querySelectorAll('span')
    expect(segments).toHaveLength(1)
    expect(segments[0]).toHaveStyle('background: #d1d5db')
  })

  it('shows 4 member-colored segments when the day has exactly 4 events', () => {
    const bar = renderBar([
      makeEvent('1', ['faiyaz']),
      makeEvent('2', ['trisha']),
      makeEvent('3', ['faiyaz']),
      makeEvent('4', ['trisha']),
    ])
    const segments = bar.querySelectorAll('span')
    expect(segments).toHaveLength(4)
    expect(segments[3]).toHaveStyle('background: #E24A8D')
  })

  it('caps at 4 segments with a grey overflow segment beyond 4 events', () => {
    const bar = renderBar([
      makeEvent('1', ['faiyaz']),
      makeEvent('2', ['trisha']),
      makeEvent('3', ['faiyaz']),
      makeEvent('4', ['trisha']),
      makeEvent('5', ['faiyaz']),
    ])
    const segments = bar.querySelectorAll('span')
    expect(segments).toHaveLength(4)
    // 4th segment is the grey "more" indicator (textDisabled)
    expect(segments[3]).toHaveStyle('background: #d1d5db')
  })

  it('exposes event titles via the title attribute', () => {
    const bar = renderBar([makeEvent('1', ['faiyaz']), makeEvent('2', ['trisha'])])
    expect(bar).toHaveAttribute('title', 'Event 1, Event 2')
  })
})
