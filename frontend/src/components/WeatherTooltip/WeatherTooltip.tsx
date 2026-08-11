import { createPortal } from 'react-dom'
import type { DailyForecast } from '../../types'
import { colors, radii, shadows, spacing, zIndices } from '../../theme/tokens'
import { WeatherIcon } from '../WeatherWidget/WeatherIcon'
import { useUiScale } from '../../hooks/useUiScale'

interface WeatherTooltipProps {
  forecast: DailyForecast | null
  visible: boolean
  x: number
  y: number
}

function formatDate(dateStr: string): { dayLabel: string; dateLabel: string } {
  const date = new Date(dateStr + 'T12:00:00')
  const today = new Date()
  today.setHours(12, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
  const dateName = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  if (date.getTime() === today.getTime()) return { dayLabel: 'Today', dateLabel: dateName }
  if (date.getTime() === tomorrow.getTime()) return { dayLabel: 'Tomorrow', dateLabel: dateName }
  return { dayLabel: dayName, dateLabel: dateName }
}

function getWindDirection(deg: number | null | undefined): string {
  if (deg == null) return ''
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]
}

function getUviLabel(uvi: number): string {
  if (uvi <= 2) return 'Low'
  if (uvi <= 5) return 'Moderate'
  if (uvi <= 7) return 'High'
  if (uvi <= 10) return 'Very High'
  return 'Extreme'
}

function getMoonPhaseLabel(phase: number | null | undefined): string {
  if (phase == null) return ''
  if (phase === 0 || phase === 1) return 'New Moon'
  if (phase < 0.25) return 'Waxing Crescent'
  if (phase === 0.25) return 'First Quarter'
  if (phase < 0.5) return 'Waxing Gibbous'
  if (phase === 0.5) return 'Full Moon'
  if (phase < 0.75) return 'Waning Gibbous'
  if (phase === 0.75) return 'Last Quarter'
  return 'Waning Crescent'
}

// Metric icon components with value-aware styling

function getThermometerColor(temp: number): string {
  if (temp < 0) return '#60A5FA' // freezing
  if (temp < 32) return '#3B82F6' // cold
  if (temp < 50) return '#60A5FA' // cool
  if (temp < 70) return '#22C55E' // mild
  if (temp < 85) return '#F59E0B' // warm
  if (temp < 100) return '#F97316' // hot
  return '#EF4444' // extreme hot
}

function ThermometerIcon({ temp }: { temp: number }) {
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

function FeelsLikeFaceIcon({ temp }: { temp: number }) {
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

function HumidityIcon({ humidity }: { humidity: number }) {
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

function WindIcon({ speed }: { speed: number }) {
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

function UVIcon({ uvi }: { uvi: number }) {
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

function PrecipIcon({ pop }: { pop: number }) {
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

function PressureIcon({ pressure }: { pressure: number }) {
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

function SunriseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <line
        x1="2"
        y1="17"
        x2="22"
        y2="17"
        stroke="#F59E0B"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M12 14V9" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M8 11l4-4 4 4"
        stroke="#FBBF24"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g stroke="#FBBF24" strokeWidth="1.5" strokeLinecap="round">
        <line x1="5" y1="13" x2="7" y2="11" />
        <line x1="19" y1="13" x2="17" y2="11" />
      </g>
    </svg>
  )
}

function SunsetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <line
        x1="2"
        y1="17"
        x2="22"
        y2="17"
        stroke="#F97316"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path d="M12 14V9" stroke="#FB923C" strokeWidth="2" strokeLinecap="round" />
      <path
        d="M8 11l4 4 4-4"
        stroke="#FB923C"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g stroke="#FB923C" strokeWidth="1.5" strokeLinecap="round">
        <line x1="5" y1="13" x2="7" y2="15" />
        <line x1="19" y1="13" x2="17" y2="15" />
      </g>
    </svg>
  )
}

function MoonIcon({ phase }: { phase: number }) {
  if (phase === 0 || phase === 1) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" fill="#374151" />
      </svg>
    )
  }
  if (phase < 0.25) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" fill="#374151" />
        <path d="M12 4a8 8 0 0 1 0 16 6 6 0 0 0 0-16z" fill="#FDE68A" />
      </svg>
    )
  }
  if (phase === 0.25) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" fill="#374151" />
        <path d="M12 4a8 8 0 0 1 0 16V4z" fill="#FDE68A" />
      </svg>
    )
  }
  if (phase < 0.5) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" fill="#FDE68A" />
        <path d="M12 4a8 8 0 0 0 0 16 6 6 0 0 1 0-16z" fill="#374151" />
      </svg>
    )
  }
  if (phase === 0.5) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" fill="#FDE68A" />
      </svg>
    )
  }
  if (phase < 0.75) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" fill="#FDE68A" />
        <path d="M12 4a8 8 0 0 1 0 16 6 6 0 0 0 0-16z" fill="#374151" />
      </svg>
    )
  }
  if (phase === 0.75) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" fill="#374151" />
        <path d="M12 4a8 8 0 0 0 0 16V4z" fill="#FDE68A" />
      </svg>
    )
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="8" fill="#374151" />
      <path d="M12 4a8 8 0 0 1 0 16 6 6 0 0 1 0-16z" fill="#FDE68A" />
    </svg>
  )
}

function TempChart({ hourly }: { hourly: DailyForecast['hourly'] }) {
  if (!hourly || hourly.length === 0) return null

  // Sample 6 evenly-spaced points from the hourly data
  const LABEL_COUNT = 6
  const sampleIndices: number[] = []
  for (let i = 0; i < LABEL_COUNT; i++) {
    sampleIndices.push(Math.round((i / (LABEL_COUNT - 1)) * (hourly.length - 1)))
  }
  const sampled = sampleIndices.map((i) => hourly[i])

  const temps = sampled.map((h) => h.temperature)
  const minTemp = Math.min(...temps)
  const maxTemp = Math.max(...temps)
  const range = maxTemp - minTemp || 1

  const width = 260
  const height = 90
  const padding = 16
  const chartWidth = width - padding * 2
  const chartHeight = height - 40

  const points = sampled.map((h, i) => {
    const x = padding + (i / (sampled.length - 1)) * chartWidth
    const y = 20 + chartHeight - ((h.temperature - minTemp) / range) * chartHeight
    return { x, y, temp: h.temperature, time: h.time }
  })

  const linePath = points.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x},${height - 20} L ${points[0].x},${height - 20} Z`

  return (
    <div style={{ marginTop: `${spacing.md}px` }}>
      <div
        style={{
          background: colors.bgHover,
          borderRadius: `${radii.lg}px`,
          padding: `${spacing.sm}px ${spacing.xs}px`,
        }}
      >
        <svg
          width="100%"
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          style={{ display: 'block' }}
        >
          <defs>
            <linearGradient id="tempAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#tempAreaGrad)" />
          <path d={linePath} fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
          {points.map((p, i) => {
            const isFirst = i === 0
            const isLast = i === points.length - 1
            return (
              <g key={i}>
                <circle cx={p.x} cy={p.y} r="3" fill="#f97316" />
                <text
                  x={p.x}
                  y={p.y - 8}
                  textAnchor={isFirst ? 'start' : isLast ? 'end' : 'middle'}
                  fill={colors.textPrimary}
                  fontSize="9"
                  fontWeight="600"
                >
                  {Math.round(p.temp)}°
                </text>
              </g>
            )
          })}
          {sampled.map((h, i) => {
            const x = padding + (i / (sampled.length - 1)) * chartWidth
            const time = new Date(h.time)
            const label = time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
            const isFirst = i === 0
            const isLast = i === sampled.length - 1
            return (
              <text
                key={i}
                x={x}
                y={height - 5}
                textAnchor={isFirst ? 'start' : isLast ? 'end' : 'middle'}
                fill={colors.textFaint}
                fontSize="9"
              >
                {label}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

function DetailItem({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div
      style={{
        background: colors.bgHover,
        borderRadius: `${radii.lg}px`,
        padding: `${spacing.sm}px ${spacing.md}px`,
        display: 'flex',
        alignItems: 'center',
        gap: `${spacing.sm}px`,
      }}
    >
      <div style={{ flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: '10px', color: colors.textFaint }}>{label}</div>
        <div style={{ fontSize: '12px', fontWeight: 500, color: colors.textPrimary }}>{value}</div>
      </div>
    </div>
  )
}

function AstroItem({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div
      style={{
        flex: 1,
        background: colors.bgHover,
        borderRadius: `${radii.lg}px`,
        padding: `${spacing.sm}px ${spacing.md}px`,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
      }}
    >
      <div>{icon}</div>
      <div style={{ fontSize: '10px', color: colors.textFaint }}>{label}</div>
      <div style={{ fontSize: '12px', fontWeight: 500, color: colors.textPrimary }}>{value}</div>
    </div>
  )
}

function formatTime(time: string): string {
  if (time.includes(':')) {
    const [h, m] = time.split(':')
    const hour = parseInt(h, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${m} ${ampm}`
  }
  return time
}

function UnifiedContent({ forecast, hasHourly }: { forecast: DailyForecast; hasHourly: boolean }) {
  const { dayLabel, dateLabel } = formatDate(forecast.date)

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: `${spacing.md}px`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: `${spacing.md}px` }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <WeatherIcon condition={forecast.icon} className="" size="large" />
          </div>
          <div>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: colors.textPrimary,
                lineHeight: 1,
              }}
            >
              {Math.round(forecast.high)}°F
            </div>
            <div style={{ fontSize: '12px', color: colors.textMuted, marginTop: '2px' }}>
              {forecast.condition.replace('-', ' ')}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>
            {dayLabel}
          </div>
          <div style={{ fontSize: '11px', color: colors.textFaint }}>{dateLabel}</div>
        </div>
      </div>

      {/* Hourly temperature chart (only for days 1-2) */}
      {hasHourly && (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: `${spacing.xs}px`,
              marginBottom: `${spacing.xs}px`,
            }}
          >
            <ThermometerIcon temp={forecast.high} />
            <div
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: colors.textFaint,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Temperature
            </div>
          </div>
          <TempChart hourly={forecast.hourly} />
        </>
      )}

      {/* Detail grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: `${spacing.sm}px`,
          marginTop: `${spacing.md}px`,
        }}
      >
        {forecast.feels_like_day != null && (
          <DetailItem
            label="Feels Like"
            value={`${Math.round(forecast.feels_like_day)}°F`}
            icon={<FeelsLikeFaceIcon temp={forecast.feels_like_day} />}
          />
        )}
        {forecast.humidity != null && (
          <DetailItem
            label="Humidity"
            value={`${forecast.humidity}%`}
            icon={<HumidityIcon humidity={forecast.humidity} />}
          />
        )}
        {forecast.wind_speed != null && (
          <DetailItem
            label="Wind"
            value={`${Math.round(forecast.wind_speed)} mph ${getWindDirection(forecast.wind_deg)}`}
            icon={<WindIcon speed={forecast.wind_speed} />}
          />
        )}
        {forecast.uvi != null && (
          <DetailItem
            label="UV Index"
            value={`${Math.round(forecast.uvi)} (${getUviLabel(forecast.uvi)})`}
            icon={<UVIcon uvi={forecast.uvi} />}
          />
        )}
        {forecast.pop != null && (
          <DetailItem
            label="Precipitation"
            value={`${Math.round(forecast.pop * 100)}%${forecast.rain ? ` · ${forecast.rain}mm` : ''}`}
            icon={<PrecipIcon pop={forecast.pop} />}
          />
        )}
        {forecast.pressure != null && (
          <DetailItem
            label="Pressure"
            value={`${forecast.pressure} hPa`}
            icon={<PressureIcon pressure={forecast.pressure} />}
          />
        )}
      </div>

      {/* Sunrise/sunset/moon */}
      {(forecast.sunrise || forecast.sunset || forecast.moon_phase != null) && (
        <div style={{ display: 'flex', gap: `${spacing.sm}px`, marginTop: `${spacing.sm}px` }}>
          {forecast.sunrise && (
            <AstroItem
              label="Sunrise"
              value={formatTime(forecast.sunrise)}
              icon={<SunriseIcon />}
            />
          )}
          {forecast.sunset && (
            <AstroItem label="Sunset" value={formatTime(forecast.sunset)} icon={<SunsetIcon />} />
          )}
          {forecast.moon_phase != null && (
            <AstroItem
              label="Moon"
              value={getMoonPhaseLabel(forecast.moon_phase)}
              icon={<MoonIcon phase={forecast.moon_phase} />}
            />
          )}
        </div>
      )}
    </div>
  )
}

export function WeatherTooltip({ forecast, visible, x, y }: WeatherTooltipProps) {
  const scale = useUiScale()

  if (!visible || !forecast) return null

  const hasHourly = (forecast.hourly?.length ?? 0) > 0
  const tooltipWidth = 300
  const tooltipHeight = hasHourly ? 450 : 380
  const offset = 12
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1000
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800

  // Horizontal: prefer right of cursor, flip left if would overflow
  let left = x + offset
  if (left + tooltipWidth * scale > vw - offset) {
    left = x - tooltipWidth * scale - offset
  }
  left = Math.max(offset, Math.min(left, vw - tooltipWidth * scale - offset))

  // Vertical: prefer below cursor, flip above if would overflow
  let top = y + offset
  if (top + tooltipHeight * scale > vh - offset) {
    top = y - tooltipHeight * scale - offset
  }
  top = Math.max(offset, Math.min(top, vh - tooltipHeight * scale - offset))

  return createPortal(
    <div
      style={{
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        zIndex: zIndices.popup,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          background: colors.white,
          border: `1px solid ${colors.border}`,
          borderRadius: `${radii.xl}px`,
          padding: `${spacing.lg}px`,
          boxShadow: shadows.popup,
          width: `${tooltipWidth}px`,
          zoom: scale,
        }}
      >
        <UnifiedContent forecast={forecast} hasHourly={hasHourly} />
      </div>
    </div>,
    document.body,
  )
}
