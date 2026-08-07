import type { FamilyMember, WeekCalendar, WeatherResponse } from '../types'

const API_BASE = import.meta.env.VITE_API_URL

if (!API_BASE) {
  throw new Error('VITE_API_URL environment variable is required')
}

async function fetchWithRetry<T>(url: string, maxRetries = 3, delayMs = 1000): Promise<T> {
  let lastError: Error | null = null

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`)
      }
      return response.json()
    } catch (error) {
      lastError = error as Error
      if (attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt)))
      }
    }
  }

  throw lastError || new Error('Failed to fetch after retries')
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/health`)
    return response.ok
  } catch {
    return false
  }
}

export async function waitForBackend(onProgress?: (elapsedMs: number) => void): Promise<void> {
  const startTime = Date.now()

  while (true) {
    if (await checkHealth()) {
      return
    }
    onProgress?.(Date.now() - startTime)
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
}

export async function getCalendar(): Promise<WeekCalendar> {
  return fetchWithRetry<WeekCalendar>(`${API_BASE}/api/calendar`)
}

export async function getWeather(): Promise<WeatherResponse> {
  return fetchWithRetry<WeatherResponse>(`${API_BASE}/api/weather`)
}

export async function getFamilyMembers(): Promise<FamilyMember[]> {
  return fetchWithRetry<FamilyMember[]>(`${API_BASE}/api/family`)
}
