import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { WeatherWidget } from './WeatherWidget'
import type { WeatherCurrent } from '../../types'

const mockWeather: WeatherCurrent = {
  temperature: 78,
  feels_like: 80,
  condition: 'clear',
  icon: 'd',
  is_night: false,
  humidity: 55,
  wind_speed: 8.5,
}

describe('WeatherWidget', () => {
  it('renders temperature', () => {
    render(<WeatherWidget weather={mockWeather} />)
    expect(screen.getByText('78°')).toBeInTheDocument()
  })

  it('renders clear icon', () => {
    render(<WeatherWidget weather={mockWeather} />)
    expect(screen.getByLabelText('Clear')).toBeInTheDocument()
  })

  it('renders clouds icon', () => {
    const cloudyWeather = { ...mockWeather, condition: 'clouds' as const }
    render(<WeatherWidget weather={cloudyWeather} />)
    expect(screen.getByLabelText('Clouds')).toBeInTheDocument()
  })

  it('renders rain icon', () => {
    const rainyWeather = { ...mockWeather, condition: 'rain' as const }
    render(<WeatherWidget weather={rainyWeather} />)
    expect(screen.getByLabelText('Rain')).toBeInTheDocument()
  })

  it('renders snow icon', () => {
    const snowyWeather = { ...mockWeather, condition: 'snow' as const }
    render(<WeatherWidget weather={snowyWeather} />)
    expect(screen.getByLabelText('Snow')).toBeInTheDocument()
  })
})
