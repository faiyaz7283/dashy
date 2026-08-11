import type { WeatherCondition } from '../../types'

interface WeatherIconProps {
  condition: WeatherCondition
  className?: string
  size?: 'small' | 'medium' | 'large'
  isNight?: boolean
}

/**
 * SVG-based weather icon component.
 * Renders a unique icon for each of the 15 OpenWeatherMap weather.main values.
 * Supports day/night variants — night icons use darker colors.
 * No emoji dependencies — pure SVG for consistent rendering across all browsers/devices.
 *
 * @param {WeatherCondition} condition - OWM weather condition (1:1 mapping)
 * @param {string} [className] - Optional CSS classes for sizing/styling
 * @param {string} [size] - Icon size: 'small' (16px), 'medium' (20px), 'large' (32px)
 * @param {boolean} [isNight] - Whether to render night variant (darker colors)
 */
export function WeatherIcon({
  condition,
  className = 'w-5 h-5',
  size,
  isNight = false,
}: WeatherIconProps) {
  const sizeMap = {
    small: { width: 16, height: 16 },
    medium: { width: 20, height: 20 },
    large: { width: 32, height: 32 },
  }
  const dimensions = size ? sizeMap[size] : null
  const style = dimensions ? { width: dimensions.width, height: dimensions.height } : undefined

  switch (condition) {
    case 'clear':
      if (isNight) {
        return (
          <svg
            className={className}
            style={style}
            viewBox="0 0 24 24"
            fill="none"
            aria-label="Clear night"
          >
            <path
              d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
              fill="#FDE68A"
              stroke="#FCD34D"
              strokeWidth="1"
            />
            <circle cx="18" cy="5" r="1" fill="#FDE68A" />
            <circle cx="20" cy="9" r="0.8" fill="#FDE68A" />
            <circle cx="16" cy="7" r="0.6" fill="#FDE68A" />
          </svg>
        )
      }
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" aria-label="Clear">
          <circle cx="12" cy="12" r="4" fill="#FBBF24" />
          <g stroke="#FBBF24" strokeWidth="2" strokeLinecap="round">
            <line x1="12" y1="2" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="22" />
            <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
            <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
            <line x1="2" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="22" y2="12" />
            <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
            <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
          </g>
        </svg>
      )

    case 'clouds':
      return (
        <svg
          className={className}
          style={style}
          viewBox="0 0 24 24"
          fill="none"
          aria-label="Clouds"
        >
          <path
            d="M6 19a4 4 0 0 1-.88-7.9A5.5 5.5 0 0 1 16.08 8 4.5 4.5 0 0 1 18 17H6z"
            fill={isNight ? '#475569' : '#94A3B8'}
          />
        </svg>
      )

    case 'rain':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" aria-label="Rain">
          <path
            d="M6 14a4 4 0 0 1-.88-7.9A5.5 5.5 0 0 1 16.08 3 4.5 4.5 0 0 1 18 12H6z"
            fill={isNight ? '#334155' : '#94A3B8'}
          />
          <g stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round">
            <line x1="8" y1="16" x2="7" y2="20" />
            <line x1="12" y1="16" x2="11" y2="20" />
            <line x1="16" y1="16" x2="15" y2="20" />
          </g>
        </svg>
      )

    case 'drizzle':
      return (
        <svg
          className={className}
          style={style}
          viewBox="0 0 24 24"
          fill="none"
          aria-label="Drizzle"
        >
          <path
            d="M6 14a4 4 0 0 1-.88-7.9A5.5 5.5 0 0 1 16.08 3 4.5 4.5 0 0 1 18 12H6z"
            fill={isNight ? '#334155' : '#94A3B8'}
          />
          <g fill="#93C5FD">
            <circle cx="9" cy="16" r="0.8" />
            <circle cx="12" cy="17" r="0.8" />
            <circle cx="15" cy="16" r="0.8" />
            <circle cx="10.5" cy="19" r="0.8" />
            <circle cx="13.5" cy="19" r="0.8" />
          </g>
        </svg>
      )

    case 'thunderstorm':
      return (
        <svg
          className={className}
          style={style}
          viewBox="0 0 24 24"
          fill="none"
          aria-label="Thunderstorm"
        >
          <path
            d="M6 14a4 4 0 0 1-.88-7.9A5.5 5.5 0 0 1 16.08 3 4.5 4.5 0 0 1 18 12H6z"
            fill={isNight ? '#1e293b' : '#64748B'}
            stroke={isNight ? '#475569' : 'none'}
            strokeWidth={isNight ? '1' : '0'}
          />
          <path
            d="M13 12l-3 5h3l-1 4 4-6h-3l1-3z"
            fill="#FBBF24"
            stroke="#F59E0B"
            strokeWidth="0.5"
          />
        </svg>
      )

    case 'snow':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" aria-label="Snow">
          <path
            d="M6 14a4 4 0 0 1-.88-7.9A5.5 5.5 0 0 1 16.08 3 4.5 4.5 0 0 1 18 12H6z"
            fill={isNight ? '#334155' : '#94A3B8'}
          />
          <g fill="#93C5FD">
            <circle cx="8" cy="17" r="1" />
            <circle cx="12" cy="18" r="1" />
            <circle cx="16" cy="17" r="1" />
            <circle cx="10" cy="21" r="1" />
            <circle cx="14" cy="21" r="1" />
          </g>
        </svg>
      )

    case 'mist':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" aria-label="Mist">
          <g
            stroke={isNight ? '#64748B' : '#CBD5E1'}
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.7"
          >
            <line x1="5" y1="7" x2="19" y2="7" />
            <line x1="7" y1="11" x2="17" y2="11" />
            <line x1="5" y1="15" x2="19" y2="15" />
            <line x1="9" y1="19" x2="15" y2="19" />
          </g>
        </svg>
      )

    case 'smoke':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" aria-label="Smoke">
          <g
            stroke={isNight ? '#57534E' : '#78716C'}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          >
            <path d="M8 20c0-3 2-4 2-7s-1-4-1-7" />
            <path d="M12 20c0-3 2-4 2-7s-1-4-1-7" />
            <path d="M16 20c0-3 2-4 2-7s-1-4-1-7" />
          </g>
        </svg>
      )

    case 'haze':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" aria-label="Haze">
          <circle cx="12" cy="10" r="4" fill="#FDE68A" opacity={isNight ? '0.3' : '0.5'} />
          <g
            stroke="#FDE68A"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity={isNight ? '0.2' : '0.4'}
          >
            <line x1="12" y1="3" x2="12" y2="5" />
            <line x1="12" y1="15" x2="12" y2="17" />
            <line x1="5" y1="10" x2="7" y2="10" />
            <line x1="17" y1="10" x2="19" y2="10" />
          </g>
          <g
            stroke={isNight ? '#78716C' : '#D6D3D1'}
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          >
            <line x1="3" y1="14" x2="21" y2="14" />
            <line x1="5" y1="18" x2="19" y2="18" />
            <line x1="7" y1="21" x2="17" y2="21" />
          </g>
        </svg>
      )

    case 'dust':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" aria-label="Dust">
          <g
            stroke={isNight ? '#78716C' : '#A8A29E'}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          >
            <path d="M4 16c2-2 5-2 7 0s5 2 7 0" />
            <path d="M6 12c1.5-1.5 4-1.5 5.5 0s4 1.5 5.5 0" />
            <path d="M8 8c1-1 3-1 4 0s3 1 4 0" />
          </g>
          <g fill={isNight ? '#78716C' : '#D6D3D1'}>
            <circle cx="6" cy="18" r="1" />
            <circle cx="10" cy="20" r="0.8" />
            <circle cx="15" cy="19" r="1" />
            <circle cx="19" cy="17" r="0.8" />
            <circle cx="12" cy="6" r="0.8" />
          </g>
        </svg>
      )

    case 'fog':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" aria-label="Fog">
          <g stroke={isNight ? '#64748B' : '#94A3B8'} strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="7" x2="21" y2="7" />
            <line x1="3" y1="11" x2="21" y2="11" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="3" y1="19" x2="21" y2="19" />
          </g>
        </svg>
      )

    case 'sand':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" aria-label="Sand">
          <g
            stroke={isNight ? '#B45309' : '#D4A574'}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          >
            <path d="M3 10c3-1 6-1 9 0s6 1 9 0" />
            <path d="M3 14c3-1 6-1 9 0s6 1 9 0" />
            <path d="M5 18c2.5-0.8 5-0.8 7.5 0s5 0.8 7.5 0" />
          </g>
          <g fill={isNight ? '#B45309' : '#D4A574'}>
            <circle cx="8" cy="8" r="0.8" />
            <circle cx="14" cy="7" r="0.6" />
            <circle cx="18" cy="9" r="0.8" />
            <circle cx="11" cy="12" r="0.6" />
            <circle cx="20" cy="12" r="0.7" />
            <circle cx="6" cy="16" r="0.6" />
            <circle cx="16" cy="16" r="0.8" />
          </g>
        </svg>
      )

    case 'ash':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" aria-label="Ash">
          <path d="M8 20l4-10 4 10z" fill={isNight ? '#44403C' : '#78716C'} opacity="0.3" />
          <g fill={isNight ? '#57534E' : '#A8A29E'}>
            <circle cx="7" cy="8" r="1" />
            <circle cx="11" cy="6" r="0.8" />
            <circle cx="15" cy="9" r="1" />
            <circle cx="9" cy="12" r="0.7" />
            <circle cx="13" cy="11" r="0.9" />
            <circle cx="17" cy="7" r="0.8" />
            <circle cx="6" cy="14" r="0.6" />
            <circle cx="18" cy="13" r="0.7" />
            <circle cx="10" cy="16" r="0.8" />
            <circle cx="14" cy="15" r="0.6" />
          </g>
        </svg>
      )

    case 'squall':
      return (
        <svg
          className={className}
          style={style}
          viewBox="0 0 24 24"
          fill="none"
          aria-label="Squall"
        >
          <path
            d="M6 12a4 4 0 0 1-.88-7.9A5.5 5.5 0 0 1 16.08 1 4.5 4.5 0 0 1 18 10H6z"
            fill={isNight ? '#0F172A' : '#475569'}
          />
          <g stroke={isNight ? '#475569' : '#64748B'} strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="14" x2="12" y2="14" />
            <line x1="5" y1="17" x2="16" y2="17" />
            <line x1="3" y1="20" x2="10" y2="20" />
          </g>
          <g stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round">
            <line x1="14" y1="13" x2="13" y2="17" />
            <line x1="18" y1="14" x2="17" y2="18" />
          </g>
        </svg>
      )

    case 'tornado':
      return (
        <svg
          className={className}
          style={style}
          viewBox="0 0 24 24"
          fill="none"
          aria-label="Tornado"
        >
          <path
            d="M6 6c2-1 4-1 6 0s4 1 6 0"
            stroke={isNight ? '#475569' : '#64748B'}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M7 9c1.5-0.8 3-0.8 4.5 0s3 0.8 4.5 0"
            stroke={isNight ? '#475569' : '#64748B'}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M8 12c1-0.6 2.5-0.6 3.5 0s2.5 0.6 3.5 0"
            stroke={isNight ? '#475569' : '#64748B'}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M9 15c0.8-0.5 2-0.5 2.8 0s2 0.5 2.8 0"
            stroke={isNight ? '#475569' : '#64748B'}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M10 18c0.5-0.3 1.2-0.3 1.8 0s1.2 0.3 1.8 0"
            stroke={isNight ? '#475569' : '#64748B'}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <g fill={isNight ? '#57534E' : '#A8A29E'}>
            <circle cx="10" cy="21" r="0.8" />
            <circle cx="13" cy="21.5" r="0.6" />
            <circle cx="15" cy="20.5" r="0.7" />
          </g>
        </svg>
      )

    default:
      return (
        <svg
          className={className}
          style={style}
          viewBox="0 0 24 24"
          fill="none"
          aria-label="Unknown weather"
        >
          <circle cx="12" cy="12" r="4" fill={isNight ? '#475569' : '#CBD5E1'} />
        </svg>
      )
  }
}
