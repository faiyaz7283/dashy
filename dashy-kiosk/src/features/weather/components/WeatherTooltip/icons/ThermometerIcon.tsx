/**
 * Thermometer icon with temperature-aware coloring.
 */

function getThermometerColor(temp: number): string {
  if (temp < 0) return '#60A5FA' // freezing
  if (temp < 32) return '#3B82F6' // cold
  if (temp < 50) return '#60A5FA' // cool
  if (temp < 70) return '#22C55E' // mild
  if (temp < 85) return '#F59E0B' // warm
  if (temp < 100) return '#F97316' // hot
  return '#EF4444' // extreme hot
}

export function ThermometerIcon({ temp }: { temp: number }) {
  const color = getThermometerColor(temp)
  const showIceCrystals = temp < 0

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M14 14.76V3.5a2.5 2.5 0 1 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" fill={color} />
      <circle cx="11.5" cy="17.5" r="2" fill="#fff" />
      {showIceCrystals && (
        <g stroke="#93C5FD" strokeWidth="1.5" strokeLinecap="round">
          <line x1="6" y1="7" x2="4" y2="5" />
          <line x1="17" y1="7" x2="19" y2="5" />
          <line x1="5" y1="10" x2="3" y2="10" />
          <line x1="18" y1="10" x2="20" y2="10" />
        </g>
      )}
    </svg>
  )
}
