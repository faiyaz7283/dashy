/**
 * UV index icon with intensity-based styling.
 */

export function UVIcon({ uvi }: { uvi: number }) {
  let color = '#FEF08A'
  let radius = 4
  let strokeWidth = 1.5

  if (uvi > 10) {
    color = '#DC2626'
    radius = 5.5
    strokeWidth = 2.5
  } else if (uvi > 7) {
    color = '#EA580C'
    radius = 5
    strokeWidth = 2
  } else if (uvi > 5) {
    color = '#F97316'
    radius = 4.5
    strokeWidth = 2
  } else if (uvi > 2) {
    color = '#FBBF24'
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r={radius} fill={color} />
      <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
        <line x1="12" y1="2" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22" />
        <line x1="2" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="22" y2="12" />
        {uvi > 2 && (
          <>
            <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
            <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
          </>
        )}
        {uvi > 5 && (
          <>
            <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
            <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
          </>
        )}
      </g>
    </svg>
  )
}
