import type { CalendarEvent, FamilyMember, WeekCalendar, WeatherResponse } from '../types'

const API_BASE = import.meta.env.VITE_API_URL

if (!API_BASE) {
  throw new Error('VITE_API_URL environment variable is required')
}

/** Cache TTL in milliseconds (2 minutes). */
const CACHE_TTL = 120_000

interface CacheEntry {
  events: CalendarEvent[]
  fetchedAt: number
}

/** In-memory cache for calendar events, keyed by date range. */
const calendarCache = new Map<string, CacheEntry>()

async function fetchWithRetry<T>(url: string, maxRetries = 5, delayMs = 2000): Promise<T> {
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
        // Exponential backoff: 2s, 4s, 8s, 16s
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

/**
 * Fetch calendar events for a date range.
 *
 * Uses an in-memory cache to avoid redundant API calls within the TTL window.
 * Rapid view switching (e.g. Day -> Week -> Day) will hit the cache on the
 * second visit to the same range.
 *
 * @param startDate - ISO format start date (e.g. "2026-08-08").
 * @param endDate - ISO format end date (e.g. "2026-08-08").
 * @param options - Optional fetch options.
 * @param options.bypassCache - If true, skip the cache and always fetch fresh data.
 * @returns Object containing the calendar data and a boolean indicating if it was served from cache.
 */
export async function getCalendar(
  startDate: string,
  endDate: string,
  options: { bypassCache?: boolean } = {},
): Promise<{ data: WeekCalendar; cached: boolean }> {
  const cacheKey = `${startDate}_${endDate}`
  const cached = calendarCache.get(cacheKey)

  if (!options.bypassCache && cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return {
      data: {
        week_start: startDate,
        week_end: endDate,
        events: cached.events,
      },
      cached: true,
    }
  }

  const params = new URLSearchParams({ start_date: startDate, end_date: endDate })
  const data = await fetchWithRetry<WeekCalendar>(`${API_BASE}/api/v1/calendar?${params}`)

  calendarCache.set(cacheKey, {
    events: data.events,
    fetchedAt: Date.now(),
  })

  return { data, cached: false }
}

/**
 * Clear the calendar cache. Useful for forcing a fresh fetch.
 */
export function clearCalendarCache(): void {
  calendarCache.clear()
}

export async function getWeather(): Promise<WeatherResponse> {
  return fetchWithRetry<WeatherResponse>(`${API_BASE}/api/v1/weather`)
}

export async function getFamilyMembers(): Promise<FamilyMember[]> {
  return fetchWithRetry<FamilyMember[]>(`${API_BASE}/api/v1/family`)
}
