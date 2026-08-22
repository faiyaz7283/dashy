/**
 * Smoke test for the root App component.
 *
 * Verifies that the AppShell renders without crashing and contains
 * the expected structural elements.
 */

import { render, screen, waitFor } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the shell with month calendar view', async () => {
    await waitFor(() => {
      render(<App />)
    })
    // Default view is month — day-of-week headers should be visible
    expect(screen.getByText('Mon')).toBeInTheDocument()
    expect(screen.getByText('Sun')).toBeInTheDocument()
  })

  it('renders header with date and clock', async () => {
    await waitFor(() => {
      render(<App />)
    })
    expect(screen.getByText('Wed, Aug 21st')).toBeInTheDocument()
    expect(screen.getByText('6:19 PM')).toBeInTheDocument()
  })
})
