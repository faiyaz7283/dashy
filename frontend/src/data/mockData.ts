import type { FamilyMember, CalendarEvent } from '../types'

export const familyMembers: FamilyMember[] = [
  { name: 'Faiyaz', key: 'faiyaz', calendar_id: 'faiyaz@gmail.com', color: '#4A90E2', initial: 'F' },
  { name: 'Trisha', key: 'trisha', calendar_id: 'trisha@gmail.com', color: '#E24A8D', initial: 'T' },
  { name: 'Arya', key: 'arya', calendar_id: 'arya@gmail.com', color: '#4ADE80', initial: 'A' },
  { name: 'Raya', key: 'raya', calendar_id: 'raya@gmail.com', color: '#FBBF24', initial: 'R' },
]

export const mockEvents: CalendarEvent[] = [
  // Monday Aug 4
  {
    id: '1',
    title: 'Team Standup',
    start: '2026-08-04T09:00',
    end: '2026-08-04T09:30',
    members: ['faiyaz'],
  },
  {
    id: '2',
    title: 'Morning Yoga',
    start: '2026-08-04T10:00',
    end: '2026-08-04T11:00',
    members: ['trisha'],
  },
  {
    id: '3',
    title: 'Soccer Practice',
    start: '2026-08-04T16:00',
    end: '2026-08-04T17:30',
    members: ['arya'],
  },
  // Tuesday Aug 5
  {
    id: '4',
    title: 'Dentist Appt',
    start: '2026-08-05T08:00',
    end: '2026-08-05T09:00',
    members: ['faiyaz', 'arya'],
  },
  {
    id: '5',
    title: 'Grocery Shopping',
    start: '2026-08-05T11:00',
    end: '2026-08-05T12:00',
    members: ['trisha'],
  },
  {
    id: '6',
    title: 'Preschool',
    start: '2026-08-05T09:00',
    end: '2026-08-05T12:00',
    members: ['raya'],
  },
  {
    id: '7',
    title: 'Gym',
    start: '2026-08-05T18:00',
    end: '2026-08-05T19:00',
    members: ['faiyaz'],
  },
  // Wednesday Aug 6
  {
    id: '8',
    title: 'Reading Club',
    start: '2026-08-06T15:00',
    end: '2026-08-06T16:00',
    members: ['arya'],
  },
  {
    id: '9',
    title: 'Piano Lesson',
    start: '2026-08-06T16:00',
    end: '2026-08-06T17:00',
    members: ['trisha', 'arya'],
  },
  {
    id: '10',
    title: 'Date Night',
    start: '2026-08-06T19:00',
    end: '2026-08-06T22:00',
    members: ['faiyaz', 'trisha'],
  },
  // Thursday Aug 7
  {
    id: '11',
    title: 'Playdate w/ Lily',
    start: '2026-08-07T10:00',
    end: '2026-08-07T12:00',
    members: ['raya'],
  },
  {
    id: '12',
    title: 'Cook Dinner',
    start: '2026-08-07T17:00',
    end: '2026-08-07T18:30',
    members: ['trisha'],
  },
  // Friday Aug 8
  {
    id: '13',
    title: 'Science Fair Project',
    start: '2026-08-08T00:00',
    end: '2026-08-08T23:59',
    all_day: true,
    members: ['arya', 'faiyaz'],
  },
  {
    id: '14',
    title: 'Team Offsite',
    start: '2026-08-08T13:00',
    end: '2026-08-08T17:00',
    members: ['faiyaz'],
  },
  {
    id: '15',
    title: 'Family Movie Night',
    start: '2026-08-08T19:00',
    end: '2026-08-08T21:00',
    members: ['faiyaz', 'trisha', 'arya', 'raya'],
  },
  // Saturday Aug 9
  {
    id: '16',
    title: 'Park Visit',
    start: '2026-08-09T10:00',
    end: '2026-08-09T12:00',
    members: ['raya', 'arya'],
  },
  {
    id: '17',
    title: 'Brunch w/ Friends',
    start: '2026-08-09T11:00',
    end: '2026-08-09T13:00',
    members: ['trisha', 'faiyaz'],
  },
  // Sunday Aug 10
  {
    id: '18',
    title: 'Meal Prep',
    start: '2026-08-10T11:00',
    end: '2026-08-10T13:00',
    members: ['faiyaz', 'trisha'],
  },
  {
    id: '19',
    title: 'Homework Catch-up',
    start: '2026-08-10T15:00',
    end: '2026-08-10T17:00',
    members: ['arya'],
  },
]

export const mockWeather = {
  temperature: 78,
  condition: 'sunny' as const,
  icon: 'sun',
}
