import '@testing-library/jest-dom'
import { Temporal } from '@js-temporal/polyfill'

// Install Temporal as a global for test environments (jsdom doesn't have it natively)
Object.assign(globalThis, { Temporal })

// Mock ResizeObserver (not available in jsdom)
globalThis.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Mock window.matchMedia (jsdom doesn't implement it)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Mock global fetch to prevent network calls in tests
globalThis.fetch = vi.fn((input: URL | RequestInfo) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
  
  // Return appropriate mock data based on endpoint
  if (url.includes('/family')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response)
  }
  if (url.includes('/calendar')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ events: [] }),
    } as Response)
  }
  if (url.includes('/weather')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ current: null, daily: null }),
    } as Response)
  }
  if (url.includes('/chores')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ categories: [], tags: [], master_chores: [], instances: [] }),
    } as Response)
  }
  // Default fallback
  return Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  } as Response)
})
