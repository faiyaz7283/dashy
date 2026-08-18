/**
 * Wind speed icon with intensity-based styling.
 */

export function WindIcon({ speed }: { speed: number }) {
  let strokeColor = '#94A3B8'
  let strokeWidth = 1.5
  let showArrow = false

  if (speed > 40) {
    strokeColor = '#334155'
    strokeWidth = 2.5
    showArrow = true
  } else if (speed > 25) {
    strokeColor = '#475569'
    strokeWidth = 2
  } else if (speed > 15) {
    strokeColor = '#64748B'
  } else if (speed <= 5) {
    strokeColor = '#94A3B8'
    strokeWidth = 1.5
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M9.59 4.59A2 2 0 1 1 11 8H2"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={speed <= 5 ? 0.5 : 1}
      />
      {speed > 5 && (
        <path
          d="M10.59 15.41A2 2 0 1 0 12 12H2"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {speed > 15 && (
        <path
          d="M15.73 11.73A2.5 2.5 0 1 1 17.5 8H2"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {showArrow && (
        <path
          d="M17 5l2-2m0 0l2 2m-2-2v4"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}
