/**
 * Humidity icon with intensity-based coloring.
 */

export function HumidityIcon({ humidity }: { humidity: number }) {
  let opacity = 0.5
  let color = '#BFDBFE'

  if (humidity >= 80) {
    opacity = 1
    color = '#1D4ED8'
  } else if (humidity >= 60) {
    opacity = 0.85
    color = '#3B82F6'
  } else if (humidity >= 30) {
    opacity = 0.7
    color = '#60A5FA'
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill={color} opacity={opacity} />
    </svg>
  )
}
