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

function TempChart({ hourly }: { hourly: DailyForecast['hourly'] }) {
  if (!hourly || hourly.length === 0) return null

  const temps = hourly.map((h) => h.temperature)
  const minTemp = Math.min(...temps)
  const maxTemp = Math.max(...temps)
  const range = maxTemp - minTemp || 1

  const width = 260
  const height = 90
  const padding = 16
  const chartWidth = width - padding * 2
  const chartHeight = height - 40

  const points = hourly.map((h, i) => {
    const x = padding + (i / (hourly.length - 1)) * chartWidth
    const y = 20 + chartHeight - ((h.temperature - minTemp) / range) * chartHeight
    return { x, y, temp: h.temperature, time: h.time }
  })

  const linePath = points.map((p, i) => (i === 0 ? `M ${p.x},${p.y}` : `L ${p.x},${p.y}`)).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x},${height - 20} L ${points[0].x},${height - 20} Z`

  return (
    <div style={{ marginTop: `${spacing.md}px` }}>
      <div
        style={{
          fontSize: '10px',
          fontWeight: 600,
          color: colors.textFaint,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: `${spacing.xs}px`,
        }}
      >
        Temperature
      </div>
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
          {hourly.map((h, i) => {
            const x = padding + (i / (hourly.length - 1)) * chartWidth
            const time = new Date(h.time)
            const label = time.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
            const isFirst = i === 0
            const isLast = i === hourly.length - 1
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

function RichContent({ forecast }: { forecast: DailyForecast }) {
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
          <WeatherIcon condition={forecast.icon} className="" />
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

      {/* Summary */}
      {forecast.summary && (
        <div
          style={{
            fontSize: '11px',
            color: colors.textMuted,
            marginBottom: `${spacing.md}px`,
            fontStyle: 'italic',
          }}
        >
          {forecast.summary}
        </div>
      )}

      {/* Temperature chart */}
      <TempChart hourly={forecast.hourly} />

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
          <DetailItem label="Feels Like" value={`${Math.round(forecast.feels_like_day)}°F`} />
        )}
        {forecast.humidity != null && (
          <DetailItem label="Humidity" value={`${forecast.humidity}%`} />
        )}
        {forecast.wind_speed != null && (
          <DetailItem
            label="Wind"
            value={`${Math.round(forecast.wind_speed)} mph ${getWindDirection(forecast.wind_deg)}`}
          />
        )}
        {forecast.uvi != null && (
          <DetailItem
            label="UV Index"
            value={`${Math.round(forecast.uvi)} (${getUviLabel(forecast.uvi)})`}
          />
        )}
        {forecast.pop != null && (
          <DetailItem
            label="Precipitation"
            value={`${Math.round(forecast.pop * 100)}%${forecast.rain ? ` · ${forecast.rain}mm` : ''}`}
          />
        )}
        {forecast.pressure != null && (
          <DetailItem label="Pressure" value={`${forecast.pressure} hPa`} />
        )}
      </div>

      {/* Sunrise/sunset/moon */}
      {(forecast.sunrise || forecast.sunset || forecast.moon_phase != null) && (
        <div style={{ display: 'flex', gap: `${spacing.sm}px`, marginTop: `${spacing.sm}px` }}>
          {forecast.sunrise && <AstroItem label="Sunrise" value={formatTime(forecast.sunrise)} />}
          {forecast.sunset && <AstroItem label="Sunset" value={formatTime(forecast.sunset)} />}
          {forecast.moon_phase != null && (
            <AstroItem label="Moon" value={getMoonPhaseLabel(forecast.moon_phase)} />
          )}
        </div>
      )}
    </div>
  )
}

function BasicContent({ forecast }: { forecast: DailyForecast }) {
  const { dayLabel, dateLabel } = formatDate(forecast.date)

  return (
    <div>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: `${spacing.sm}px`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: `${spacing.sm}px` }}>
          <WeatherIcon condition={forecast.icon} className="" />
          <div>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 700,
                color: colors.textPrimary,
                lineHeight: 1,
              }}
            >
              {Math.round(forecast.high)}°F
            </div>
            <div style={{ fontSize: '11px', color: colors.textMuted }}>
              {forecast.condition.replace('-', ' ')}
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: colors.textPrimary }}>
            {dayLabel}
          </div>
          <div style={{ fontSize: '10px', color: colors.textFaint }}>{dateLabel}</div>
        </div>
      </div>

      {/* Basic details */}
      <div style={{ display: 'flex', gap: `${spacing.sm}px` }}>
        <BasicDetail label="High" value={`${Math.round(forecast.high)}°`} />
        <BasicDetail label="Low" value={`${Math.round(forecast.low)}°`} />
        {forecast.pop != null && (
          <BasicDetail label="Rain" value={`${Math.round(forecast.pop * 100)}%`} />
        )}
        {forecast.wind_speed != null && (
          <BasicDetail label="Wind" value={`${Math.round(forecast.wind_speed)} mph`} />
        )}
      </div>
    </div>
  )
}

function DetailItem({ label, value }: { label: string; value: string }) {
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
      <div>
        <div style={{ fontSize: '10px', color: colors.textFaint }}>{label}</div>
        <div style={{ fontSize: '12px', fontWeight: 500, color: colors.textPrimary }}>{value}</div>
      </div>
    </div>
  )
}

function AstroItem({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: colors.bgHover,
        borderRadius: `${radii.lg}px`,
        padding: `${spacing.sm}px ${spacing.md}px`,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '10px', color: colors.textFaint }}>{label}</div>
      <div style={{ fontSize: '12px', fontWeight: 500, color: colors.textPrimary }}>{value}</div>
    </div>
  )
}

function BasicDetail({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: colors.bgHover,
        borderRadius: `${radii.lg}px`,
        padding: `${spacing.sm}px`,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '10px', color: colors.textFaint }}>{label}</div>
      <div style={{ fontSize: '13px', fontWeight: 600, color: colors.textPrimary }}>{value}</div>
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

export function WeatherTooltip({ forecast, visible, x, y }: WeatherTooltipProps) {
  const scale = useUiScale()

  if (!visible || !forecast) return null

  const isRich = (forecast.hourly?.length ?? 0) > 0
  const tooltipWidth = 300
  const tooltipHeight = isRich ? 450 : 180
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
        {isRich ? <RichContent forecast={forecast} /> : <BasicContent forecast={forecast} />}
      </div>
    </div>,
    document.body,
  )
}
