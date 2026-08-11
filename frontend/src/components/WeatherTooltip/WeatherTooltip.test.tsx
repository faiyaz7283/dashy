import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { WeatherTooltip } from './WeatherTooltip'
import type { DailyForecast } from '../../types'

const mockForecast: DailyForecast = {
  date: '2026-08-11',
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
      time: '2026-08-11T06:00:00',
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
      time: '2026-08-11T09:00:00',
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
      time: '2026-08-11T12:00:00',
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
      time: '2026-08-11T15:00:00',
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
      time: '2026-08-11T18:00:00',
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
      time: '2026-08-11T21:00:00',
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
    const basicForecast: DailyForecast = {
      date: '2026-08-11',
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
    expect(screen.getByText('Aug 11')).toBeInTheDocument()
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
})
