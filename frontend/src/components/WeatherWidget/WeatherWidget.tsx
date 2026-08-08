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
    <div className="flex items-center gap-1 text-gray-600">
      <WeatherIcon condition={weather.icon} className="w-5 h-5" />
      <span className="text-lg font-medium">{Math.round(weather.temperature)}°</span>
    </div>
  )
}
