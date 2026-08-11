interface WeatherIconProps {
  condition: string
  className?: string
  size?: 'small' | 'medium' | 'large'
}

/**
 * SVG-based weather icon component.
 * Renders consistent icons across all browsers/devices without emoji font dependencies.
 * Designed to support future animation enhancements.
 *
 * @param {string} condition - Weather condition (sunny, cloudy, rainy, partly-cloudy, snowy)
 * @param {string} [className] - Optional CSS classes for sizing/styling
 * @param {string} [size] - Icon size: 'small' (16px), 'medium' (20px), 'large' (32px)
 */
export function WeatherIcon({ condition, className = 'w-5 h-5', size }: WeatherIconProps) {
  const sizeMap = {
    small: { width: 16, height: 16 },
    medium: { width: 20, height: 20 },
    large: { width: 32, height: 32 },
  }
  const dimensions = size ? sizeMap[size] : null
  const style = dimensions ? { width: dimensions.width, height: dimensions.height } : undefined

  switch (condition) {
    case 'sunny':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" aria-label="Sunny">
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

    case 'cloudy':
      return (
        <svg
          className={className}
          style={style}
          viewBox="0 0 24 24"
          fill="none"
          aria-label="Cloudy"
        >
          <path
            d="M6 19a4 4 0 0 1-.88-7.9A5.5 5.5 0 0 1 16.08 8 4.5 4.5 0 0 1 18 17H6z"
            fill="#94A3B8"
          />
        </svg>
      )

    case 'rainy':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" aria-label="Rainy">
          <path
            d="M6 14a4 4 0 0 1-.88-7.9A5.5 5.5 0 0 1 16.08 3 4.5 4.5 0 0 1 18 12H6z"
            fill="#94A3B8"
          />
          <g stroke="#60A5FA" strokeWidth="1.5" strokeLinecap="round">
            <line x1="8" y1="16" x2="7" y2="20" />
            <line x1="12" y1="16" x2="11" y2="20" />
            <line x1="16" y1="16" x2="15" y2="20" />
          </g>
        </svg>
      )

    case 'partly-cloudy':
      return (
        <svg
          className={className}
          style={style}
          viewBox="0 0 24 24"
          fill="none"
          aria-label="Partly cloudy"
        >
          <circle cx="8" cy="8" r="3.5" fill="#FBBF24" />
          <g stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round">
            <line x1="8" y1="1.5" x2="8" y2="3" />
            <line x1="8" y1="13" x2="8" y2="14.5" />
            <line x1="2.5" y1="2.5" x2="3.5" y2="3.5" />
            <line x1="12.5" y1="12.5" x2="13.5" y2="13.5" />
            <line x1="1.5" y1="8" x2="3" y2="8" />
          </g>
          <path
            d="M9 20a3.5 3.5 0 0 1-.77-6.91A4.5 4.5 0 0 1 17 11a3.5 3.5 0 0 1 1.5 6.73H9z"
            fill="#94A3B8"
          />
        </svg>
      )

    case 'snowy':
      return (
        <svg className={className} style={style} viewBox="0 0 24 24" fill="none" aria-label="Snowy">
          <path
            d="M6 14a4 4 0 0 1-.88-7.9A5.5 5.5 0 0 1 16.08 3 4.5 4.5 0 0 1 18 12H6z"
            fill="#94A3B8"
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

    default:
      return (
        <svg
          className={className}
          style={style}
          viewBox="0 0 24 24"
          fill="none"
          aria-label="Unknown weather"
        >
          <circle cx="12" cy="12" r="4" fill="#CBD5E1" />
        </svg>
      )
  }
}
