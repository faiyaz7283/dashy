/**
 * Weather tooltip showing detailed forecast information.
 */

import { createPortal } from 'react-dom'
import { useState } from 'react'
import { spacing, radii, shadows, zIndices, colors } from '@/theme/tokens'
import { LOCALE } from '@/theme/config'
import type { DailyForecast } from '@/types'
import { ThermometerIcon } from './icons/ThermometerIcon'
import { FeelsLikeFaceIcon } from './icons/FeelsLikeFaceIcon'
import { HumidityIcon } from './icons/HumidityIcon'
import { WindIcon } from './icons/WindIcon'
import { UVIcon } from './icons/UVIcon'
import { PrecipIcon } from './icons/PrecipIcon'
import { PressureIcon } from './icons/PressureIcon'
import { SunriseIcon } from './icons/SunriseIcon'
import { SunsetIcon } from './icons/SunsetIcon'
import { MoonIcon } from './icons/MoonIcon'
import { TempChart } from './icons/TempChart'

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

  const dayName = date.toLocaleDateString(LOCALE, { weekday: 'short' })
  const dateName = date.toLocaleDateString(LOCALE, { month: 'short', day: 'numeric' })

  if (date.getTime() === today.getTime()) return { dayLabel: 'Today', dateLabel: dateName }
  if (date.getTime() === tomorrow.getTime()) return { dayLabel: 'Tomorrow', dateLabel: dateName }
  return { dayLabel: dayName, dateLabel: dateName }
}

function getWindDirection(deg: number | null | undefined): string {
  if (deg == null) return ''
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  return dirs[Math.round(deg / 45) % 8]!
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
    const hour = parseInt(h!, 10)
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
          <div style={{ fontSize: '48px' }}>
            {forecast.icon === 'clear'
              ? '☀️'
              : forecast.icon === 'clouds'
                ? '☁️'
                : forecast.icon === 'rain'
                  ? '🌧️'
                  : forecast.icon === 'drizzle'
                    ? '🌦️'
                    : forecast.icon === 'thunderstorm'
                      ? '⛈️'
                      : forecast.icon === 'snow'
                        ? '🌨️'
                        : forecast.icon === 'mist' || forecast.icon === 'fog'
                          ? '🌫️'
                          : '🌤️'}
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
  const [position, setPosition] = useState({ x: 0, y: 0 })

  if (!visible || !forecast) return null

  const hasHourly = (forecast.hourly?.length ?? 0) > 0
  const tooltipWidth = 300
  const tooltipHeight = hasHourly ? 450 : 380
  const offset = 12
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1000
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800

  // Horizontal: prefer right of cursor, flip left if would overflow
  let left = x + offset
  if (left + tooltipWidth > vw - offset) {
    left = x - tooltipWidth - offset
  }
  left = Math.max(offset, Math.min(left, vw - tooltipWidth - offset))

  // Vertical: prefer below cursor, flip above if would overflow
  let top = y + offset
  if (top + tooltipHeight > vh - offset) {
    top = y - tooltipHeight - offset
  }
  top = Math.max(offset, Math.min(top, vh - tooltipHeight - offset))

  if (position.x !== left || position.y !== top) {
    setPosition({ x: left, y: top })
  }

  return createPortal(
    <div
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
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
        }}
      >
        <UnifiedContent forecast={forecast} hasHourly={hasHourly} />
      </div>
    </div>,
    document.body,
  )
}
