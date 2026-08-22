/**
 * API endpoint registry — single source of truth for all backend endpoints.
 *
 * Centralizes endpoint URLs, HTTP methods, refresh intervals, and cache TTLs.
 * Adding a new endpoint requires only: add entry here + define response type.
 */

/** API base URL from environment variable. */
const API_BASE = import.meta.env.VITE_API_URL

if (!API_BASE) {
  throw new Error('VITE_API_URL environment variable is required')
}

/**
 * Endpoint configuration.
 */
export interface EndpointConfig {
  /** Full endpoint URL (API_BASE + path). */
  url: string
  /** HTTP method. */
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /** Auto-refresh interval in milliseconds (0 = no auto-refresh). */
  refreshInterval: number
  /** Cache TTL in milliseconds (0 = no caching). */
  cacheTtl: number
}

/**
 * API endpoint registry.
 *
 * All endpoints used by the frontend are defined here. Refresh intervals
 * and cache TTLs are configurable per endpoint.
 */
export const ENDPOINTS = {
  health: {
    url: `${API_BASE}/health`,
    method: 'GET',
    refreshInterval: 0,
    cacheTtl: 0,
  },
  calendar: {
    url: `${API_BASE}/api/v1/calendar`,
    method: 'GET',
    refreshInterval: 120_000, // 2 minutes
    cacheTtl: 120_000, // 2 minutes
  },
  weather: {
    url: `${API_BASE}/api/v1/weather`,
    method: 'GET',
    refreshInterval: 600_000, // 10 minutes
    cacheTtl: 0, // No client-side caching (backend handles it)
  },
  family: {
    url: `${API_BASE}/api/v1/family`,
    method: 'GET',
    refreshInterval: 0, // Fetch once on mount
    cacheTtl: 0,
  },
  chores: {
    url: `${API_BASE}/api/v1/chores`,
    method: 'GET',
    refreshInterval: 120_000, // 2 minutes
    cacheTtl: 60_000, // 1 minute
  },
} as const satisfies Record<string, EndpointConfig>

/**
 * Endpoint keys for type-safe access.
 */
export type EndpointKey = keyof typeof ENDPOINTS

/**
 * Get endpoint configuration by key.
 *
 * @param key - Endpoint key (e.g., 'calendar', 'weather').
 * @returns Endpoint configuration object.
 */
export function getEndpoint<K extends EndpointKey>(key: K): EndpointConfig {
  return ENDPOINTS[key]
}
