import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { WeatherTooltip } from './WeatherTooltip'
import type { DailyForecast } from '../../types'

// Helper to get today's date in YYYY-MM-DD format
const getTodayStr = () => {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

const mockForecast: DailyForecast = {
  date: getTodayStr(),
  high: 78,
  low: 66,
  condition: 'clouds',
  icon: 'clouds',
  humidity: 60,
  wind_speed: 10,
  feels_like_day: 77,
  feels_like_night: 63,
  temp_morn: 63,
  temp_day: 75,
  temp_eve: 72,
  temp_night: 65,
  pressure: 1013,
  dew_point: 63.0,
  wind_gust: 15.0,
  wind_deg: 240,
  uvi: 5.0,
  pop: 0.15,
  rain: 0.0,
  snow: 0.0,
  clouds: 40,
  sunrise: '06:13',
  sunset: '19:47',
  moonrise: '20:45',
  moonset: '08:35',
  moon_phase: 0.8,
  summary: 'Cloudy with mild temperatures',
  hourly: [
    {
      time: `${getTodayStr()}T06:00:00`,
      temperature: 63,
      feels_like: 61,
      condition: 'clouds',
      icon: 'clouds',
      humidity: 60,
      wind_speed: 10,
      pop: 0.15,
      pressure: 1013,
      dew_point: 63.0,
      uvi: 5.0,
    },
    {
      time: `${getTodayStr()}T09:00:00`,
      temperature: 67,
      feels_like: 65,
      condition: 'clouds',
      icon: 'clouds',
      humidity: 62,
      wind_speed: 10.5,
      pop: 0.15,
      pressure: 1013,
      dew_point: 63.0,
      uvi: 4.2,
    },
    {
      time: `${getTodayStr()}T12:00:00`,
      temperature: 71,
      feels_like: 69,
      condition: 'clouds',
      icon: 'clouds',
      humidity: 64,
      wind_speed: 11,
      pop: 0.15,
      pressure: 1013,
      dew_point: 63.0,
      uvi: 3.4,
    },
    {
      time: `${getTodayStr()}T15:00:00`,
      temperature: 74,
      feels_like: 72,
      condition: 'clouds',
      icon: 'clouds',
      humidity: 66,
      wind_speed: 11.5,
      pop: 0.15,
      pressure: 1013,
      dew_point: 63.0,
      uvi: 2.6,
    },
    {
      time: `${getTodayStr()}T18:00:00`,
      temperature: 72,
      feels_like: 70,
      condition: 'clouds',
      icon: 'clouds',
      humidity: 68,
      wind_speed: 12,
      pop: 0.15,
      pressure: 1013,
      dew_point: 63.0,
      uvi: 1.8,
    },
    {
      time: `${getTodayStr()}T21:00:00`,
      temperature: 69,
      feels_like: 67,
      condition: 'clouds',
      icon: 'clouds',
      humidity: 70,
      wind_speed: 12.5,
      pop: 0.15,
      pressure: 1013,
      dew_point: 63.0,
      uvi: 1.0,
    },
  ],
}

describe('WeatherTooltip', () => {
  it('renders nothing when not visible', () => {
    const { container } = render(
      <WeatherTooltip forecast={mockForecast} visible={false} x={100} y={100} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when forecast is null', () => {
    const { container } = render(<WeatherTooltip forecast={null} visible={true} x={100} y={100} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders basic content when forecast has no hourly data', () => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const basicForecast: DailyForecast = {
      date: todayStr,
      high: 78,
      low: 66,
      condition: 'clear',
      icon: 'clear',
    }

    render(<WeatherTooltip forecast={basicForecast} visible={true} x={100} y={100} />)

    expect(screen.getByText('78°F')).toBeInTheDocument()
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('renders rich content with hourly chart when hourly data exists', () => {
    render(<WeatherTooltip forecast={mockForecast} visible={true} x={100} y={100} />)

    expect(screen.getByText('78°F')).toBeInTheDocument()
    expect(screen.getByText('Today')).toBeInTheDocument()
    // Date should match today's date (dynamic)
    const today = new Date()
    const expectedDate = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    expect(screen.getByText(expectedDate)).toBeInTheDocument()
    // "Temperature" appears once as section heading (removed duplicate from chart)
    expect(screen.getByText('Temperature')).toBeInTheDocument()
  })

  it('renders weather details', () => {
    render(<WeatherTooltip forecast={mockForecast} visible={true} x={100} y={100} />)

    expect(screen.getByText('Feels Like')).toBeInTheDocument()
    expect(screen.getByText('77°F')).toBeInTheDocument()
    expect(screen.getByText('Humidity')).toBeInTheDocument()
    expect(screen.getByText('60%')).toBeInTheDocument()
  })

  it('renders sunrise and sunset times', () => {
    render(<WeatherTooltip forecast={mockForecast} visible={true} x={100} y={100} />)

    expect(screen.getByText('Sunrise')).toBeInTheDocument()
    expect(screen.getByText('6:13 AM')).toBeInTheDocument()
    expect(screen.getByText('Sunset')).toBeInTheDocument()
    expect(screen.getByText('7:47 PM')).toBeInTheDocument()
  })

  it('renders moon phase', () => {
    render(<WeatherTooltip forecast={mockForecast} visible={true} x={100} y={100} />)

    expect(screen.getByText('Moon')).toBeInTheDocument()
    expect(screen.getByText('Waning Crescent')).toBeInTheDocument()
  })

  it('shows hourly temperature chart when hourly data exists', () => {
    render(<WeatherTooltip forecast={mockForecast} visible={true} x={100} y={100} />)
    // "Temperature" heading appears when hasHourly is true
    expect(screen.getByText('Temperature')).toBeInTheDocument()
  })

  it('hides hourly temperature chart when no hourly data', () => {
    const basicForecast: DailyForecast = {
      date: getTodayStr(),
      high: 78,
      low: 66,
      condition: 'clear',
      icon: 'clear',
    }
    render(<WeatherTooltip forecast={basicForecast} visible={true} x={100} y={100} />)
    // No hourly chart section should be rendered (check for "Temperature" heading)
    expect(screen.queryByText('Temperature')).not.toBeInTheDocument()
  })

  it('renders all rich metrics for any day (unified content)', () => {
    // A day 10 forecast with no hourly data should still show all rich metrics
    const day10Forecast: DailyForecast = {
      date: '2026-08-21',
      high: 82,
      low: 70,
      condition: 'rain',
      icon: 'rain',
      feels_like_day: 84,
      feels_like_night: 68,
      temp_morn: 68,
      temp_day: 80,
      temp_eve: 76,
      temp_night: 70,
      humidity: 72,
      pressure: 1012,
      dew_point: 68.0,
      wind_speed: 12,
      wind_gust: 18.0,
      wind_deg: 200,
      uvi: 4.0,
      pop: 0.65,
      rain: 3.2,
      snow: 0.0,
      clouds: 70,
      sunrise: '06:15',
      sunset: '19:45',
      moonrise: '21:00',
      moonset: '09:00',
      moon_phase: 0.5,
      hourly: [],
    }
    render(<WeatherTooltip forecast={day10Forecast} visible={true} x={100} y={100} />)
    // All rich metrics present
    expect(screen.getByText('Feels Like')).toBeInTheDocument()
    expect(screen.getByText('84°F')).toBeInTheDocument()
    expect(screen.getByText('Humidity')).toBeInTheDocument()
    expect(screen.getByText('72%')).toBeInTheDocument()
    expect(screen.getByText('Wind')).toBeInTheDocument()
    expect(screen.getByText('UV Index')).toBeInTheDocument()
    expect(screen.getByText('Precipitation')).toBeInTheDocument()
    expect(screen.getByText(/65%/)).toBeInTheDocument()
    expect(screen.getByText('Pressure')).toBeInTheDocument()
    expect(screen.getByText('Sunrise')).toBeInTheDocument()
    expect(screen.getByText('Sunset')).toBeInTheDocument()
    expect(screen.getByText('Moon')).toBeInTheDocument()
    expect(screen.getByText('Full Moon')).toBeInTheDocument()
    // No hourly chart heading for day 10 (no hourly data)
    expect(screen.queryByText('Temperature')).not.toBeInTheDocument()
  })

  it('renders correct day labels (Today, Tomorrow, weekday)', () => {
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`

    const todayForecast: DailyForecast = {
      date: todayStr,
      high: 78,
      low: 66,
      condition: 'clear',
      icon: 'clear',
    }
    const { unmount } = render(
      <WeatherTooltip forecast={todayForecast} visible={true} x={100} y={100} />,
    )
    expect(screen.getByText('Today')).toBeInTheDocument()
    unmount()

    const tomorrowForecast: DailyForecast = {
      date: tomorrowStr,
      high: 80,
      low: 68,
      condition: 'clouds',
      icon: 'clouds',
    }
    render(<WeatherTooltip forecast={tomorrowForecast} visible={true} x={100} y={100} />)
    expect(screen.getByText('Tomorrow')).toBeInTheDocument()
  })
})
