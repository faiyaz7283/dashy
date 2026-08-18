import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { ErrorFallback } from './ErrorFallback'

interface ErrorBoundaryProps {
  /** The component tree to protect. */
  children: ReactNode
  /** Custom fallback UI. Defaults to ErrorFallback. */
  fallback?: ReactNode | ((error: Error, onReset: () => void) => ReactNode)
}

interface ErrorBoundaryState {
  /** The caught error, or null if no error has occurred. */
  error: Error | null
}

/**
 * Catches JavaScript errors in its child component tree and displays a fallback UI.
 *
 * Logs errors to the console for debugging. Supports a custom fallback via the
 * `fallback` prop — either a static ReactNode or a render function receiving
 * the error and a reset callback.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <WeatherWidget />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  private handleReset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    if (this.state.error !== null) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error, this.handleReset)
      }
      if (this.props.fallback !== undefined) {
        return this.props.fallback
      }
      return <ErrorFallback error={this.state.error} onReset={this.handleReset} />
    }

    return this.props.children
  }
}
