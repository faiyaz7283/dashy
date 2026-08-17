import { colors, spacing, radii } from '@/theme/tokens'

interface ErrorFallbackProps {
  /** The error that was caught. */
  error: Error
  /** Callback to reset the error boundary and retry rendering. */
  onReset: () => void
}

/**
 * Default fallback UI for ErrorBoundary.
 *
 * Displays the error message and a "Try Again" button that resets the boundary.
 * Styled for full-screen display (outer boundary) or inline (widget boundary).
 *
 * @param error - The caught error.
 * @param onReset - Callback to reset and retry.
 */
export function ErrorFallback({ error, onReset }: ErrorFallbackProps) {
  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: `${spacing.md}px`,
        padding: `${spacing.xl}px`,
        minHeight: '200px',
        color: colors.textPrimary,
        textAlign: 'center',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: '1.25rem',
          fontWeight: 600,
          color: colors.textPrimary,
        }}
      >
        Something went wrong
      </h2>
      <p
        style={{
          margin: 0,
          fontSize: '0.875rem',
          color: colors.textSecondary,
          maxWidth: '400px',
        }}
      >
        {error.message || 'An unexpected error occurred.'}
      </p>
      <button
        type="button"
        onClick={onReset}
        style={{
          marginTop: `${spacing.sm}px`,
          padding: `${spacing.sm}px ${spacing.lg}px`,
          fontSize: '0.875rem',
          fontWeight: 500,
          color: colors.white,
          backgroundColor: colors.primary,
          border: 'none',
          borderRadius: `${radii.md}px`,
          cursor: 'pointer',
        }}
      >
        Try Again
      </button>
    </div>
  )
}
