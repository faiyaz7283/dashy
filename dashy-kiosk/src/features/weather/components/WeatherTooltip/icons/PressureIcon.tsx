/**
 * Pressure icon with gauge needle.
 */

export function PressureIcon({ pressure }: { pressure: number }) {
  let needleColor = '#22C55E'
  let needleX = 12
  let needleY = 5

  if (pressure < 1000) {
    needleColor = '#EF4444'
    needleX = 6
    needleY = 7
  } else if (pressure > 1020) {
    needleColor = '#3B82F6'
    needleX = 18
    needleY = 7
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M12 20a8 8 0 1 1 0-16" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      <line
        x1="12"
        y1="12"
        x2={needleX}
        y2={needleY}
        stroke={needleColor}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2" fill="#475569" />
    </svg>
  )
}
