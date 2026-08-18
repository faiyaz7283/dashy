/**
 * Feels-like face icon with temperature-aware expressions.
 */

type FaceExpression = 'freezing' | 'cold' | 'comfortable' | 'warm' | 'hot' | 'extreme'

interface FaceColors {
  faceBg: string
  faceBorder: string
  featureColor: string
  expression: FaceExpression
}

function getFaceColors(temp: number): FaceColors {
  if (temp < 32) {
    return {
      faceBg: '#DBEAFE',
      faceBorder: '#93C5FD',
      featureColor: '#3B82F6',
      expression: 'freezing',
    }
  }
  if (temp < 50) {
    return { faceBg: '#DBEAFE', faceBorder: '#93C5FD', featureColor: '#3B82F6', expression: 'cold' }
  }
  if (temp < 75) {
    return {
      faceBg: '#DCFCE7',
      faceBorder: '#86EFAC',
      featureColor: '#16A34A',
      expression: 'comfortable',
    }
  }
  if (temp < 85) {
    return { faceBg: '#FEF3C7', faceBorder: '#FCD34D', featureColor: '#D97706', expression: 'warm' }
  }
  if (temp < 100) {
    return { faceBg: '#FEE2E2', faceBorder: '#FCA5A5', featureColor: '#DC2626', expression: 'hot' }
  }
  return {
    faceBg: '#FEE2E2',
    faceBorder: '#F87171',
    featureColor: '#DC2626',
    expression: 'extreme',
  }
}

export function FeelsLikeFaceIcon({ temp }: { temp: number }) {
  const { faceBg, faceBorder, featureColor, expression } = getFaceColors(temp)

  return (
    <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="10" fill={faceBg} stroke={faceBorder} strokeWidth="1" />
      {expression === 'freezing' && (
        <>
          <path
            d="M9 12l2 1 2-1"
            stroke={featureColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M15 12l2 1 2-1"
            stroke={featureColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M11 17h6" stroke={featureColor} strokeWidth="1.5" strokeLinecap="round" />
          <line x1="12.5" y1="16.5" x2="12.5" y2="17.5" stroke={featureColor} strokeWidth="1" />
          <line x1="14" y1="16.5" x2="14" y2="17.5" stroke={featureColor} strokeWidth="1" />
          <line x1="15.5" y1="16.5" x2="15.5" y2="17.5" stroke={featureColor} strokeWidth="1" />
          <g stroke="#60A5FA" strokeWidth="1" strokeLinecap="round">
            <line x1="4" y1="5" x2="4" y2="8" />
            <line x1="2.5" y1="6.5" x2="5.5" y2="6.5" />
            <line x1="24" y1="4" x2="24" y2="7" />
            <line x1="22.5" y1="5.5" x2="25.5" y2="5.5" />
          </g>
        </>
      )}
      {expression === 'cold' && (
        <>
          <path
            d="M9 12l2 1 2-1"
            stroke={featureColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M15 12l2 1 2-1"
            stroke={featureColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M10 17.5c1.5 1 4.5 1 6 0"
            stroke={featureColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <ellipse cx="22" cy="16" rx="3" ry="2" fill="#BFDBFE" opacity="0.6" />
        </>
      )}
      {expression === 'comfortable' && (
        <>
          <circle cx="10.5" cy="12" r="1.2" fill={featureColor} />
          <circle cx="17.5" cy="12" r="1.2" fill={featureColor} />
          <path
            d="M10 16c1.5 2 6.5 2 8 0"
            stroke={featureColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <g stroke="#86EFAC" strokeWidth="1" strokeLinecap="round">
            <line x1="5" y1="6" x2="5" y2="8" />
            <line x1="4" y1="7" x2="6" y2="7" />
          </g>
        </>
      )}
      {expression === 'warm' && (
        <>
          <path
            d="M9 12.5c.5-1 2.5-1 3 0"
            stroke={featureColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M16 12.5c.5-1 2.5-1 3 0"
            stroke={featureColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M10 16c1.5 2 6.5 2 8 0"
            stroke={featureColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <g stroke="#FBBF24" strokeWidth="1" strokeLinecap="round" opacity="0.6">
            <line x1="4" y1="5" x2="5" y2="6" />
            <line x1="24" y1="5" x2="23" y2="6" />
          </g>
        </>
      )}
      {expression === 'hot' && (
        <>
          <path
            d="M9 12l2 1 2-1"
            stroke={featureColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M15 12l2 1 2-1"
            stroke={featureColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
          <ellipse cx="14" cy="17.5" rx="2.5" ry="1.5" fill="#FCA5A5" />
          <path d="M20 8c0-1.5 1-2 1-2s1 .5 1 2a1 1 0 0 1-2 0z" fill="#60A5FA" />
          <g stroke="#F97316" strokeWidth="1.2" strokeLinecap="round" fill="none">
            <path d="M3 5c1-1 2-1 3 0" />
            <path d="M22 4c1-1 2-1 3 0" />
          </g>
        </>
      )}
      {expression === 'extreme' && (
        <>
          <g stroke={featureColor} strokeWidth="1.5" strokeLinecap="round">
            <line x1="9" y1="11" x2="11.5" y2="13.5" />
            <line x1="11.5" y1="11" x2="9" y2="13.5" />
            <line x1="16.5" y1="11" x2="19" y2="13.5" />
            <line x1="19" y1="11" x2="16.5" y2="13.5" />
          </g>
          <path d="M10 18h8" stroke={featureColor} strokeWidth="2" strokeLinecap="round" />
          <line x1="12" y1="17" x2="12" y2="19" stroke={featureColor} strokeWidth="1" />
          <line x1="14" y1="17" x2="14" y2="19" stroke={featureColor} strokeWidth="1" />
          <line x1="16" y1="17" x2="16" y2="19" stroke={featureColor} strokeWidth="1" />
          <path d="M21 7c0-1.5 1-2 1-2s1 .5 1 2a1 1 0 0 1-2 0z" fill="#60A5FA" />
          <g stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" fill="none">
            <path d="M2 4c1.5-1.5 3-1.5 4.5 0" />
            <path d="M21 3c1.5-1.5 3-1.5 4.5 0" />
          </g>
        </>
      )}
    </svg>
  )
}
