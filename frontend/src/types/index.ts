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
  wind_gust?: number | null
  wind_deg?: number | null
  pressure?: number | null
  dew_point?: number | null
  uvi?: number | null
  sunrise?: string | null // HH:MM format
  sunset?: string | null // HH:MM format
}

export interface HourlyForecast {
  time: string // ISO datetime
  temperature: number
  feels_like: number
  condition: string
  icon: string
  humidity: number
  wind_speed: number
  pop: number // probability of precipitation (0-1)
  pressure?: number | null
  dew_point?: number | null
  uvi?: number | null
}

export interface DailyForecast {
  date: string
  high: number
  low: number
  condition: string
  icon: string

  // Rich fields (days 1-7 from One Call API)
  feels_like_day?: number | null
  feels_like_night?: number | null
  temp_morn?: number | null
  temp_day?: number | null
  temp_eve?: number | null
  temp_night?: number | null
  humidity?: number | null
  pressure?: number | null
  dew_point?: number | null
  wind_speed?: number | null
  wind_gust?: number | null
  wind_deg?: number | null
  uvi?: number | null
  pop?: number | null // probability of precipitation (0-1)
  rain?: number | null // mm
  snow?: number | null // mm
  clouds?: number | null // percentage
  sunrise?: string | null // HH:MM format
  sunset?: string | null // HH:MM format
  moonrise?: string | null // HH:MM format
  moonset?: string | null // HH:MM format
  moon_phase?: number | null // 0-1
  summary?: string | null

  // Hourly breakdown (days 1-7 only)
  hourly?: HourlyForecast[]
}

export interface WeatherResponse {
  current: WeatherCurrent
  forecast: DailyForecast[]
}
