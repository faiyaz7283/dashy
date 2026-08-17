import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

/** Component that throws an error during render. */
function ThrowingComponent({ message }: { message: string }): never {
  throw new Error(message)
}

/** Suppress React error boundary console.error noise in tests. */
function suppressErrorLogs(): void {
  vi.spyOn(console, 'error').mockImplementation(() => {})
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Child content</div>
      </ErrorBoundary>,
    )

    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('renders fallback UI when a child throws', () => {
    suppressErrorLogs()

    render(
      <ErrorBoundary>
        <ThrowingComponent message="Test error" />
      </ErrorBoundary>,
    )

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText('Something went wrong')).toBeInTheDocument()
    expect(screen.getByText('Test error')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('renders custom fallback when provided', () => {
    suppressErrorLogs()

    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowingComponent message="Test" />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Custom fallback')).toBeInTheDocument()
  })

  it('renders render-function fallback with error and reset', () => {
    suppressErrorLogs()

    render(
      <ErrorBoundary
        fallback={(error, onReset) => (
          <div>
            <span>Error: {error.message}</span>
            <button type="button" onClick={onReset}>
              Reset
            </button>
          </div>
        )}
      >
        <ThrowingComponent message="Custom error" />
      </ErrorBoundary>,
    )

    expect(screen.getByText('Error: Custom error')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset/i })).toBeInTheDocument()
  })
})
