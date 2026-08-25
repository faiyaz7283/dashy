/**
 * Shared weather icon component.
 *
 * Renders a lucide-react icon for a weather condition at the specified size.
 * Used across calendar views (week, month) and weather popup.
 */

import { Sun, Cloud, CloudRain, CloudDrizzle, CloudLightning, CloudSnow, CloudFog } from 'lucide-react'
import type { WeatherCondition } from '@/types/weather'

/** Size variants for weather icons. */
export type WeatherIconSize = 'sm' | 'md' | 'lg'

/** Props for the WeatherIcon component. */
export interface WeatherIconProps {
  /** Weather condition to display. */
  condition: WeatherCondition
  /** Icon size variant. */
  size?: WeatherIconSize
  /** Additional CSS classes. */
  className?: string
}

/** Size mapping for icon dimensions. */
const sizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-12 w-12',
} as const

/**
 * Weather icon component.
 *
 * @param props - Weather condition and display configuration.
 * @returns The weather icon SVG.
 */
export function WeatherIcon({ condition, size = 'md', className = '' }: WeatherIconProps) {
  const sizeClass = sizeClasses[size]

  switch (condition) {
    case 'clear':
      return <Sun className={`${sizeClass} ${className}`} />
    case 'clouds':
      return <Cloud className={`${sizeClass} ${className}`} />
    case 'rain':
      return <CloudRain className={`${sizeClass} ${className}`} />
    case 'drizzle':
      return <CloudDrizzle className={`${sizeClass} ${className}`} />
    case 'thunderstorm':
      return <CloudLightning className={`${sizeClass} ${className}`} />
    case 'snow':
      return <CloudSnow className={`${sizeClass} ${className}`} />
    case 'mist':
    case 'fog':
      return <CloudFog className={`${sizeClass} ${className}`} />
    default:
      return <Sun className={`${sizeClass} ${className}`} />
  }
}
