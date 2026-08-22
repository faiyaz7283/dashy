import '@testing-library/jest-dom'
import { Temporal } from '@js-temporal/polyfill'

// Install Temporal as a global for test environments (jsdom doesn't have it natively)
Object.assign(globalThis, { Temporal })

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
globalThis.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ events: [] }),
  } as Response)
)
