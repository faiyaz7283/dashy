import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { WeatherWidget } from './WeatherWidget'
import type { WeatherCurrent } from '../../types'

const mockWeather: WeatherCurrent = {
  temperature: 78,
  feels_like: 80,
  condition: 'sunny',
  icon: 'sunny',
  humidity: 55,
  wind_speed: 8.5,
}

describe('WeatherWidget', () => {
  it('renders temperature', () => {
    render(<WeatherWidget weather={mockWeather} />)
    expect(screen.getByText('78°')).toBeInTheDocument()
  })

  it('renders sunny icon', () => {
    render(<WeatherWidget weather={mockWeather} />)
    expect(screen.getByLabelText('Sunny')).toBeInTheDocument()
  })

  it('renders cloudy icon', () => {
    const cloudyWeather = { ...mockWeather, icon: 'cloudy' }
    render(<WeatherWidget weather={cloudyWeather} />)
    expect(screen.getByLabelText('Cloudy')).toBeInTheDocument()
  })

  it('renders rainy icon', () => {
    const rainyWeather = { ...mockWeather, icon: 'rainy' }
    render(<WeatherWidget weather={rainyWeather} />)
    expect(screen.getByLabelText('Rainy')).toBeInTheDocument()
  })

  it('renders partly cloudy icon', () => {
    const partlyCloudyWeather = { ...mockWeather, icon: 'partly-cloudy' }
    render(<WeatherWidget weather={partlyCloudyWeather} />)
    expect(screen.getByLabelText('Partly cloudy')).toBeInTheDocument()
  })
})
