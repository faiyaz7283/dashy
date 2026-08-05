import type { FamilyMember, WeekCalendar, WeatherResponse } from '../types'

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.dashy.local'

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

export async function getCalendar(): Promise<WeekCalendar> {
  return fetchJson<WeekCalendar>(`${API_BASE}/api/calendar`)
}

export async function getWeather(): Promise<WeatherResponse> {
  return fetchJson<WeatherResponse>(`${API_BASE}/api/weather`)
}

export async function getFamilyMembers(): Promise<FamilyMember[]> {
  return fetchJson<FamilyMember[]>(`${API_BASE}/api/family`)
}
