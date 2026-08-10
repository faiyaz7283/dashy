export interface FamilyMember {
  name: string
  key: string
  calendar_id: string
  color: string
  initial: string
}

/** Available calendar view modes. */
export type CalendarView = 'day' | 'week' | 'month' | 'year'

/** RSVP status for an event attendee (matches backend Attendee model). */
export type AttendeeStatus = 'accepted' | 'declined' | 'tentative' | 'needsAction'

export interface Attendee {
  member_key: string | null // null for external guests not in family config
  email: string
  display_name: string
  status: AttendeeStatus
  color: string // member color or default grey for external guests
}

export interface CalendarEvent {
  id: string
  title: string
  start: string // ISO date string
  end: string
  all_day?: boolean
  location?: string
  members: string[] // family member keys
  description?: string | null
  organizer?: string | null // member key of the event organizer
  attendees?: Attendee[]
  recurring_event_id?: string | null
  is_recurring_instance?: boolean
  recurrence_rule?: string | null // e.g., "RRULE:FREQ=WEEKLY;BYDAY=MO"
}

export interface WeekCalendar {
  week_start: string
  week_end: string
  events: CalendarEvent[]
}

export interface WeatherCurrent {
  temperature: number
  feels_like: number
  condition: string
  icon: string
  humidity: number
  wind_speed: number
}

export interface WeatherForecast {
  date: string
  high: number
  low: number
  condition: string
  icon: string
}

export interface WeatherResponse {
  current: WeatherCurrent
  forecast: WeatherForecast[]
}
