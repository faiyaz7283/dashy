/**
 * Weather popup — shows detailed weather information on hover.
 *
 * Displays:
 * - Header: weather icon + temperature + condition + date
 * - Hourly temperature chart (for full version)
 * - Detail grid: 2 columns (Feels Like, Humidity, Wind, UV Index, Precipitation, Pressure)
 * - Astronomy row: Sunrise, Sunset, Moon
 *
 * Width: w-80 (320px), scaled via useUiScale
 */

import { Droplets, Wind, Thermometer, Cloud, Gauge, Sunrise, Sunset, Moon } from 'lucide-react'
import type { WeatherCurrent, DailyForecast } from '@/types/weather'

/** Props for the WeatherPopup component. */
export interface WeatherPopupProps {
  /** Current weather conditions. */
  current: WeatherCurrent
  /** Daily forecast (optional, for additional details). */
  forecast?: DailyForecast
  /** Date label (e.g., "Today", "Tomorrow", "Wed"). */
  dateLabel: string
  /** Date sublabel (e.g., "Aug 20"). */
  dateSublabel: string
}

/**
 * Weather popup showing detailed weather information.
 *
 * @param props - Weather data and date labels.
 * @returns The weather popup UI.
 */
export function WeatherPopup({ current, forecast, dateLabel, dateSublabel }: WeatherPopupProps) {
  return (
    <div className="w-80 rounded-xl bg-white p-4 shadow-[0_8px_24px_rgba(0,0,0,0.15)] ring-1 ring-border dark:bg-bg dark:shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
      <div className="space-y-4">
        {/* Header: icon + temp + condition + date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-5xl">{getWeatherEmoji(current.condition)}</div>
            <div>
              <div className="text-3xl font-bold leading-none text-text-primary">
                {Math.round(current.temperature)}°F
              </div>
              <div className="mt-0.5 text-xs text-text-muted">{current.condition}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-text-primary">{dateLabel}</div>
            <div className="text-xs text-text-faint">{dateSublabel}</div>
          </div>
        </div>

        {/* Detail grid: 2 columns */}
        <div className="grid grid-cols-2 gap-2">
          {/* Feels Like */}
          <div className="flex items-center gap-2 rounded-lg bg-bg-hover p-2">
            <Thermometer className="h-4 w-4 flex-shrink-0 text-warning" />
            <div>
              <div className="text-[10px] text-text-faint">Feels Like</div>
              <div className="text-xs font-medium text-text-primary">
                {Math.round(current.feels_like)}°F
              </div>
            </div>
          </div>

          {/* Humidity */}
          <div className="flex items-center gap-2 rounded-lg bg-bg-hover p-2">
            <Droplets className="h-4 w-4 flex-shrink-0 text-primary" />
            <div>
              <div className="text-[10px] text-text-faint">Humidity</div>
              <div className="text-xs font-medium text-text-primary">{current.humidity}%</div>
            </div>
          </div>

          {/* Wind */}
          <div className="flex items-center gap-2 rounded-lg bg-bg-hover p-2">
            <Wind className="h-4 w-4 flex-shrink-0 text-text-muted" />
            <div>
              <div className="text-[10px] text-text-faint">Wind</div>
              <div className="text-xs font-medium text-text-primary">
                {Math.round(current.wind_speed)} mph
              </div>
            </div>
          </div>

          {/* UV Index */}
          {current.uvi !== undefined && current.uvi !== null && (
            <div className="flex items-center gap-2 rounded-lg bg-bg-hover p-2">
              <Cloud className="h-4 w-4 flex-shrink-0 text-warning" />
              <div>
                <div className="text-[10px] text-text-faint">UV Index</div>
                <div className="text-xs font-medium text-text-primary">
                  {Math.round(current.uvi)} ({getUVLabel(current.uvi)})
                </div>
              </div>
            </div>
          )}

          {/* Precipitation */}
          {forecast?.pop !== undefined && forecast.pop !== null && (
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
          {current.pressure !== undefined && current.pressure !== null && (
            <div className="flex items-center gap-2 rounded-lg bg-bg-hover p-2">
              <Gauge className="h-4 w-4 flex-shrink-0 text-text-muted" />
              <div>
                <div className="text-[10px] text-text-faint">Pressure</div>
                <div className="text-xs font-medium text-text-primary">
                  {current.pressure} hPa
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Astronomy row: Sunrise, Sunset, Moon */}
        <div className="flex gap-2">
          {/* Sunrise */}
          {current.sunrise && (
            <div className="flex flex-1 flex-col items-center gap-1 rounded-lg bg-bg-hover p-2 text-center">
              <Sunrise className="h-4 w-4 text-warning" />
              <div className="text-[10px] text-text-faint">Sunrise</div>
              <div className="text-xs font-medium text-text-primary">{current.sunrise}</div>
            </div>
          )}

          {/* Sunset */}
          {current.sunset && (
            <div className="flex flex-1 flex-col items-center gap-1 rounded-lg bg-bg-hover p-2 text-center">
              <Sunset className="h-4 w-4 text-warning" />
              <div className="text-[10px] text-text-faint">Sunset</div>
              <div className="text-xs font-medium text-text-primary">{current.sunset}</div>
            </div>
          )}

          {/* Moon phase (placeholder) */}
          <div className="flex flex-1 flex-col items-center gap-1 rounded-lg bg-bg-hover p-2 text-center">
            <Moon className="h-4 w-4 text-text-muted" />
            <div className="text-[10px] text-text-faint">Moon</div>
            <div className="text-xs font-medium text-text-primary">—</div>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Returns an emoji for a weather condition.
 *
 * Placeholder until custom SVG icons are implemented.
 */
function getWeatherEmoji(condition: string): string {
  switch (condition) {
    case 'clear':
      return '☀️'
    case 'clouds':
      return '☁️'
    case 'rain':
      return '🌧️'
    case 'drizzle':
      return '🌦️'
    case 'thunderstorm':
      return '⛈️'
    case 'snow':
      return '🌨️'
    case 'mist':
    case 'fog':
      return '🌫️'
    default:
      return '🌤️'
  }
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
