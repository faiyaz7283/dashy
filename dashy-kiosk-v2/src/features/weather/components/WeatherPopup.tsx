/**
 * Weather popup — shows detailed weather information on hover.
 *
 * Two variants:
 * - Full (with hourly chart): When forecast.hourly data is available (days 1-7)
 * - Compact (without chart): When hourly data is not available (days 8-16)
 *
 * Displays:
 * - Header: weather icon + temperature + condition + date
 * - Hourly temperature chart (full version only)
 * - Detail grid: 2 columns (Feels Like, Humidity, Wind, UV Index, Precipitation, Pressure)
 * - Astronomy row: Sunrise, Sunset, Moon
 *
 * Width: w-80 (320px)
 */

import {
  Droplets,
  Wind,
  Thermometer,
  Cloud,
  Gauge,
  Sunrise,
  Sunset,
  Moon,
} from 'lucide-react'
import { WeatherIcon } from './WeatherIcon'
import type { DailyForecast } from '@/types/weather'

/** Props for the WeatherPopup component. */
export interface WeatherPopupProps {
  /** Daily forecast data for the day. */
  forecast: DailyForecast
  /** Date label (e.g., "Today", "Tomorrow", "Wed"). */
  dateLabel: string
  /** Date sublabel (e.g., "Aug 20"). */
  dateSublabel: string
}

/**
 * Weather popup showing detailed weather information.
 *
 * Automatically shows the hourly chart when forecast.hourly data is available.
 *
 * @param props - Forecast data and date labels.
 * @returns The weather popup UI.
 */
export function WeatherPopup({ forecast, dateLabel, dateSublabel }: WeatherPopupProps) {
  const hasHourly = forecast.hourly && forecast.hourly.length > 0

  return (
    <div className="w-80 rounded-xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.15)] ring-1 ring-border dark:bg-bg dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
      <div className="space-y-4">
        {/* Header: icon + temp + condition + date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-warning">
              <WeatherIcon condition={forecast.condition} size="lg" />
            </div>
            <div>
              <div className="text-3xl font-bold leading-none text-text-primary">
                {Math.round(forecast.high)}°F
              </div>
              <div className="mt-0.5 text-xs text-text-muted">{forecast.condition}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-text-primary">{dateLabel}</div>
            <div className="text-xs text-text-faint">{dateSublabel}</div>
          </div>
        </div>

        {/* Hourly temperature chart (full version only) */}
        {hasHourly && <HourlyChart hourly={forecast.hourly} />}

        {/* Detail grid: 2 columns */}
        <div className="grid grid-cols-2 gap-2">
          {/* Feels Like */}
          {forecast.feels_like_day !== undefined && forecast.feels_like_day !== null && (
            <div className="flex items-center gap-2 rounded-lg bg-bg-hover p-2">
              <Thermometer className="h-4 w-4 flex-shrink-0 text-warning" />
              <div>
                <div className="text-[10px] text-text-faint">Feels Like</div>
                <div className="text-xs font-medium text-text-primary">
                  {Math.round(forecast.feels_like_day)}°F
                </div>
              </div>
            </div>
          )}

          {/* Humidity */}
          {forecast.humidity !== undefined && forecast.humidity !== null && (
            <div className="flex items-center gap-2 rounded-lg bg-bg-hover p-2">
              <Droplets className="h-4 w-4 flex-shrink-0 text-primary" />
              <div>
                <div className="text-[10px] text-text-faint">Humidity</div>
                <div className="text-xs font-medium text-text-primary">{forecast.humidity}%</div>
              </div>
            </div>
          )}

          {/* Wind */}
          {forecast.wind_speed !== undefined && forecast.wind_speed !== null && (
            <div className="flex items-center gap-2 rounded-lg bg-bg-hover p-2">
              <Wind className="h-4 w-4 flex-shrink-0 text-text-muted" />
              <div>
                <div className="text-[10px] text-text-faint">Wind</div>
                <div className="text-xs font-medium text-text-primary">
                  {Math.round(forecast.wind_speed)} mph
                </div>
              </div>
            </div>
          )}

          {/* UV Index */}
          {forecast.uvi !== undefined && forecast.uvi !== null && (
            <div className="flex items-center gap-2 rounded-lg bg-bg-hover p-2">
              <Cloud className="h-4 w-4 flex-shrink-0 text-warning" />
              <div>
                <div className="text-[10px] text-text-faint">UV Index</div>
                <div className="text-xs font-medium text-text-primary">
                  {Math.round(forecast.uvi)} ({getUVLabel(forecast.uvi)})
                </div>
              </div>
            </div>
          )}

          {/* Precipitation */}
          {forecast.pop !== undefined && forecast.pop !== null && (
            <div className="flex items-center gap-2 rounded-lg bg-bg-hover p-2">
              <Droplets className="h-4 w-4 flex-shrink-0 text-primary" />
              <div>
                <div className="text-[10px] text-text-faint">Precipitation</div>
                <div className="text-xs font-medium text-text-primary">
                  {Math.round(forecast.pop * 100)}%
                  {forecast.rain !== undefined && forecast.rain !== null && forecast.rain > 0 && (
                    <> · {forecast.rain}mm</>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pressure */}
          {forecast.pressure !== undefined && forecast.pressure !== null && (
            <div className="flex items-center gap-2 rounded-lg bg-bg-hover p-2">
              <Gauge className="h-4 w-4 flex-shrink-0 text-text-muted" />
              <div>
                <div className="text-[10px] text-text-faint">Pressure</div>
                <div className="text-xs font-medium text-text-primary">
                  {forecast.pressure} hPa
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Astronomy row: Sunrise, Sunset, Moon */}
        <div className="flex gap-2">
          {/* Sunrise */}
          {forecast.sunrise && (
            <div className="flex flex-1 flex-col items-center gap-1 rounded-lg bg-bg-hover p-2 text-center">
              <Sunrise className="h-4 w-4 text-warning" />
              <div className="text-[10px] text-text-faint">Sunrise</div>
              <div className="text-xs font-medium text-text-primary">{forecast.sunrise}</div>
            </div>
          )}

          {/* Sunset */}
          {forecast.sunset && (
            <div className="flex flex-1 flex-col items-center gap-1 rounded-lg bg-bg-hover p-2 text-center">
              <Sunset className="h-4 w-4 text-warning" />
              <div className="text-[10px] text-text-faint">Sunset</div>
              <div className="text-xs font-medium text-text-primary">{forecast.sunset}</div>
            </div>
          )}

          {/* Moon phase (placeholder) */}
          <div className="flex flex-1 flex-col items-center gap-1 rounded-lg bg-bg-hover p-2 text-center">
            <Moon className="h-4 w-4 text-text-muted" />
            <div className="text-[10px] text-text-faint">Moon</div>
            <div className="text-xs font-medium text-text-primary">
              {forecast.moon_phase !== undefined && forecast.moon_phase !== null
                ? getMoonPhaseLabel(forecast.moon_phase)
                : '—'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Props for the hourly chart sub-component. */
interface HourlyChartProps {
  /** Hourly forecast data. */
  hourly: DailyForecast['hourly']
}

/**
 * Hourly temperature chart visualization.
 *
 * Shows a simplified bar chart of temperatures across the day.
 *
 * @param props - Hourly forecast data.
 * @returns The hourly chart UI.
 */
function HourlyChart({ hourly }: HourlyChartProps) {
  if (!hourly || hourly.length === 0) return null

  // Sample 6 evenly-spaced hours for the chart
  const sampleCount = 6
  const step = Math.max(1, Math.floor(hourly.length / sampleCount))
  const samples = hourly.filter((_, i) => i % step === 0).slice(0, sampleCount)

  // Calculate min/max for scaling
  const temps = samples.map((h) => h.temperature)
  const minTemp = Math.min(...temps)
  const maxTemp = Math.max(...temps)
  const range = maxTemp - minTemp || 1

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5">
        <Thermometer className="h-3.5 w-3.5 text-text-faint" />
        <div className="text-[10px] font-semibold uppercase tracking-wide text-text-faint">
          Temperature
        </div>
      </div>
      <div className="flex items-end justify-between gap-1 px-1">
        {samples.map((hour, idx) => {
          const heightPercent = ((hour.temperature - minTemp) / range) * 60 + 25
          const hourDate = new Date(hour.time)
          const hourLabel = hourDate.toLocaleTimeString('en-US', {
            hour: 'numeric',
            hour12: true,
          })

          return (
            <div key={idx} className="flex flex-1 flex-col items-center gap-1">
              <div className="text-[9px] text-text-faint">{Math.round(hour.temperature)}°</div>
              <div
                className="w-full rounded-sm bg-primary/30"
                style={{ height: `${heightPercent}%` }}
              />
              <div className="text-[9px] text-text-faint">{hourLabel}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Returns a human-readable label for a UV index value.
 */
function getUVLabel(uvi: number): string {
  if (uvi <= 2) return 'Low'
  if (uvi <= 5) return 'Moderate'
  if (uvi <= 7) return 'High'
  if (uvi <= 10) return 'Very High'
  return 'Extreme'
}

/**
 * Returns a human-readable label for a moon phase value (0-1).
 */
function getMoonPhaseLabel(phase: number): string {
  if (phase < 0.0625) return 'New Moon'
  if (phase < 0.1875) return 'Waxing Crescent'
  if (phase < 0.3125) return 'First Quarter'
  if (phase < 0.4375) return 'Waxing Gibbous'
  if (phase < 0.5625) return 'Full Moon'
  if (phase < 0.6875) return 'Waning Gibbous'
  if (phase < 0.8125) return 'Last Quarter'
  if (phase < 0.9375) return 'Waning Crescent'
  return 'New Moon'
}
