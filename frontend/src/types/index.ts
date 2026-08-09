export interface FamilyMember {
  name: string
  key: string
  calendar_id: string
  color: string
  initial: string
}

/** Available calendar view modes. */
export type CalendarView = 'day' | 'week' | 'month' | 'year'

export interface CalendarEvent {
  id: string
  title: string
  start: string // ISO date string
  end: string
  all_day?: boolean
  location?: string
  members: string[] // family member keys
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
