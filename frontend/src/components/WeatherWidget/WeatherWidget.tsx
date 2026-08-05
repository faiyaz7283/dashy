import type { WeatherCurrent } from '../../types'

interface WeatherWidgetProps {
  weather: WeatherCurrent
}

export function WeatherWidget({ weather }: WeatherWidgetProps) {
  const icons: Record<string, string> = {
    sunny: '☀️',
    cloudy: '☁️',
    rainy: '🌧️',
    'partly-cloudy': '⛅',
    snowy: '️',
  }

  return (
    <div className="flex items-center gap-1 text-gray-600">
      <span className="text-lg">{icons[weather.icon] || '️'}</span>
      <span className="text-lg font-medium">{Math.round(weather.temperature)}°</span>
    </div>
  )
}
