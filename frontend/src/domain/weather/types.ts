/**
 * Weather domain types.
 *
 * Defines the shape of weather data returned by the backend, matching
 * the OpenWeatherMap API response structure.
 */

/**
 * All 15 distinct OpenWeatherMap weather.main values.
 *
 * Maps 1:1 to backend condition values — no grouping or aliasing.
 */
export type WeatherCondition =
  | 'clear'
  | 'clouds'
  | 'rain'
  | 'drizzle'
  | 'thunderstorm'
  | 'snow'
  | 'mist'
  | 'smoke'
  | 'haze'
  | 'dust'
  | 'fog'
  | 'sand'
  | 'ash'
  | 'squall'
  | 'tornado'

/** Current weather conditions at the configured location. */
export interface WeatherCurrent {
  /** Current temperature in the configured unit. */
  temperature: number
  /** Perceived temperature. */
  feels_like: number
  /** Weather condition category. */
  condition: WeatherCondition
  /** 'd' for day, 'n' for night. */
  icon: string
  /** Whether it is currently nighttime. */
  is_night: boolean
  /** Relative humidity percentage (0–100). */
  humidity: number
  /** Wind speed in the configured unit. */
  wind_speed: number
  /** Maximum wind gust speed. */
  wind_gust?: number | null
  /** Wind direction in degrees. */
  wind_deg?: number | null
  /** Atmospheric pressure in hPa. */
  pressure?: number | null
  /** Dew point temperature. */
  dew_point?: number | null
  /** UV index. */
  uvi?: number | null
  /** Sunrise time in HH:MM format. */
  sunrise?: string | null
  /** Sunset time in HH:MM format. */
  sunset?: string | null
}

/** Hourly forecast entry for a single hour. */
export interface HourlyForecast {
  /** ISO datetime string. */
  time: string
  /** Temperature for the hour. */
  temperature: number
  /** Perceived temperature. */
  feels_like: number
  /** Weather condition category. */
  condition: WeatherCondition
  /** Weather condition for icon selection. */
  icon: WeatherCondition
  /** Relative humidity percentage. */
  humidity: number
  /** Wind speed. */
  wind_speed: number
  /** Probability of precipitation (0–1). */
  pop: number
  /** Atmospheric pressure. */
  pressure?: number | null
  /** Dew point temperature. */
  dew_point?: number | null
  /** UV index. */
  uvi?: number | null
}

/**
 * Daily forecast entry for a single day.
 *
 * Days 1–7 include rich detail fields (feels_like_day/night, hourly breakdown).
 * Days 8–16 include only basic fields (high, low, condition).
 */
export interface DailyForecast {
  /** Date string in YYYY-MM-DD format. */
  date: string
  /** Daily high temperature. */
  high: number
  /** Daily low temperature. */
  low: number
  /** Weather condition category. */
  condition: WeatherCondition
  /** Weather condition for icon selection. */
  icon: WeatherCondition
  /** Daytime perceived temperature (days 1-7). */
  feels_like_day?: number | null
  /** Nighttime perceived temperature (days 1-7). */
  feels_like_night?: number | null
  /** Morning temperature (days 1-7). */
  temp_morn?: number | null
  /** Daytime temperature (days 1-7). */
  temp_day?: number | null
  /** Evening temperature (days 1-7). */
  temp_eve?: number | null
  /** Nighttime temperature (days 1-7). */
  temp_night?: number | null
  /** Relative humidity percentage (days 1-7). */
  humidity?: number | null
  /** Atmospheric pressure (days 1-7). */
  pressure?: number | null
  /** Dew point temperature (days 1-7). */
  dew_point?: number | null
  /** Wind speed (days 1-7). */
  wind_speed?: number | null
  /** Wind gust speed (days 1-7). */
  wind_gust?: number | null
  /** Wind direction in degrees (days 1-7). */
  wind_deg?: number | null
  /** UV index (days 1-7). */
  uvi?: number | null
  /** Probability of precipitation 0–1 (days 1-7). */
  pop?: number | null
  /** Rainfall in mm (days 1-7). */
  rain?: number | null
  /** Snowfall in mm (days 1-7). */
  snow?: number | null
  /** Cloud coverage percentage (days 1-7). */
  clouds?: number | null
  /** Sunrise time in HH:MM format. */
  sunrise?: string | null
  /** Sunset time in HH:MM format. */
  sunset?: string | null
  /** Moonrise time in HH:MM format (days 1-7). */
  moonrise?: string | null
  /** Moonset time in HH:MM format (days 1-7). */
  moonset?: string | null
  /** Moon phase 0-1 (days 1-7). */
  moon_phase?: number | null
  /** Text summary of conditions (days 1-7). */
  summary?: string | null
  /** Hourly breakdown (days 1-7). */
  hourly?: HourlyForecast[]
}

/** Complete weather response with current conditions and forecast. */
export interface WeatherResponse {
  /** Current weather conditions. */
  current: WeatherCurrent
  /** Array of daily forecasts (up to 16 days). */
  forecast: DailyForecast[]
}
