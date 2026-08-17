/**
 * Precipitation icon with probability-based styling.
 */

export function PrecipIcon({ pop }: { pop: number }) {
  let cloudColor = '#CBD5E1'
  let dropColor = '#93C5FD'
  let dropWidth = 1.5
  let dropCount = 1

  if (pop >= 0.8) {
    cloudColor = '#475569'
    dropColor = '#2563EB'
    dropWidth = 2
    dropCount = 4
  } else if (pop >= 0.5) {
    cloudColor = '#64748B'
    dropColor = '#3B82F6'
    dropCount = 3
  } else if (pop >= 0.2) {
    cloudColor = '#94A3B8'
    dropCount = 2
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 14a4 4 0 0 1-.88-7.9A5.5 5.5 0 0 1 16.08 3 4.5 4.5 0 0 1 18 12H6z"
        fill={cloudColor}
      />
      <g stroke={dropColor} strokeWidth={dropWidth} strokeLinecap="round">
        {dropCount >= 1 && <line x1="8" y1="15" x2="7" y2="19" />}
        {dropCount >= 2 && <line x1="12" y1="15" x2="11" y2="19" />}
        {dropCount >= 3 && <line x1="16" y1="15" x2="15" y2="19" />}
        {dropCount >= 4 && <line x1="10" y1="15" x2="9" y2="20" />}
      </g>
    </svg>
  )
}
