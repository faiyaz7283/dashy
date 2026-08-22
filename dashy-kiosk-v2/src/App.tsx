/**
 * Root application component.
 *
 * Renders the AppShell layout which provides the full-viewport structure
 * (header, sidebar, status bar, content area). The AppShell applies UI
 * scaling and serves as the container for all feature views.
 */

import AppShell from '@/features/shell/AppShell'

export default function App() {
  return <AppShell />
}
