import { useState, useCallback, useRef } from 'react'
import type { DailyForecast } from '@/types'

interface WeatherTooltipState {
  visible: boolean
  x: number
  y: number
  forecast: DailyForecast | null
}

interface UseWeatherTooltipReturn {
  tooltipState: WeatherTooltipState
  showTooltip: (forecast: DailyForecast, x: number, y: number) => void
  hideTooltip: () => void
  togglePin: (forecast: DailyForecast, x: number, y: number) => void
}

export function useWeatherTooltip(): UseWeatherTooltipReturn {
  const [tooltipState, setTooltipState] = useState<WeatherTooltipState>({
    visible: false,
    x: 0,
    y: 0,
    forecast: null,
  })
  const pinnedRef = useRef(false)

  const showTooltip = useCallback((forecast: DailyForecast, x: number, y: number) => {
    if (pinnedRef.current) return
    setTooltipState({ visible: true, x, y, forecast })
  }, [])

  const hideTooltip = useCallback(() => {
    if (pinnedRef.current) return
    setTooltipState((prev) => ({ ...prev, visible: false }))
  }, [])

  const togglePin = useCallback((forecast: DailyForecast, x: number, y: number) => {
    if (pinnedRef.current) {
      pinnedRef.current = false
      setTooltipState((prev) => ({ ...prev, visible: false }))
    } else {
      pinnedRef.current = true
      setTooltipState({ visible: true, x, y, forecast })
    }
  }, [])

  return { tooltipState, showTooltip, hideTooltip, togglePin }
}
