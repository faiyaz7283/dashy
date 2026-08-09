import type { WeatherCurrent } from '../../types'
import { WeatherIcon } from './WeatherIcon'

interface WeatherWidgetProps {
  weather: WeatherCurrent
}

/**
 * Displays current weather information with SVG icon and temperature.
 *
 * @param {WeatherCurrent} weather - Current weather data from API
 */
export function WeatherWidget({ weather }: WeatherWidgetProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        color: '#4b5563',
        whiteSpace: 'nowrap',
      }}
    >
      <WeatherIcon condition={weather.icon} className="w-4 h-4" />
      <span style={{ fontSize: '14px', fontWeight: 500 }}>{Math.round(weather.temperature)}°</span>
    </div>
  )
}
