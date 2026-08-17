/**
 * Temperature chart showing hourly forecast.
 */

import { spacing, radii, colors } from '@/theme/tokens'
import { LOCALE } from '@/theme/config'
import type { DailyForecast } from '@/types'

export function TempChart({ hourly }: { hourly: DailyForecast['hourly'] }) {
  if (!hourly || hourly.length === 0) return null

  // Sample 6 evenly-spaced points from the hourly data
  const LABEL_COUNT = 6
  const sampleIndices: number[] = []
  for (let i = 0; i < LABEL_COUNT; i++) {
    sampleIndices.push(Math.round((i / (LABEL_COUNT - 1)) * (hourly.length - 1)))
  }
  const sampled = sampleIndices.map((i) => hourly[i]!)

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
  const areaPath = `${linePath} L ${points[points.length - 1]!.x},${height - 20} L ${points[0]!.x},${height - 20} Z`

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
            const label = time.toLocaleTimeString(LOCALE, { hour: 'numeric', hour12: true })
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
