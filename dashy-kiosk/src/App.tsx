/**
 * Root application component.
 *
 * Wraps the AppShell in an ErrorBoundary to catch render crashes.
 * All layout, data fetching, and view management lives in AppShell.
 */

import { ErrorBoundary } from '@/shared/components/ErrorBoundary'
import { AppShell } from '@/features/dashboard/AppShell'

/**
 * Application entry point.
 *
 * @returns The root component tree.
 */
export function App() {
  return (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  )
}
