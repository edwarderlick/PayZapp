import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

/**
 * Catches render-time errors anywhere in the tree below it and shows a
 * recovery screen instead of an unrecoverable white screen. Without this,
 * a single thrown error in any panel (a malformed RPC response, an SDK
 * exception during render, etc.) takes down the entire app for the user.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error('[PayZapp] Unhandled render error', error, info.componentStack)
  }

  handleReload = () => {
    this.setState({ error: null })
    window.location.reload()
  }

  handleGoHome = () => {
    this.setState({ error: null })
    window.location.href = '/'
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div
        className="min-h-screen w-full flex items-center justify-center px-6"
        style={{ background: 'var(--bg-base)' }}
      >
        <div
          className="w-full max-w-md p-8 rounded-3xl text-center"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)', boxShadow: '0 24px 64px rgba(0,0,0,0.4)' }}
        >
          <div
            className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6"
            style={{ background: 'rgba(240,82,82,0.1)', border: '1px solid rgba(240,82,82,0.25)' }}
          >
            <AlertTriangle className="w-7 h-7" style={{ color: '#F05252' }} />
          </div>
          <h1 className="text-xl font-display font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Something went wrong
          </h1>
          <p className="text-sm mb-1" style={{ color: 'var(--text-secondary)' }}>
            PayZapp hit an unexpected error and couldn't continue rendering this page.
          </p>
          <p className="text-xs font-number mb-6 px-3 py-2 rounded-lg text-left overflow-x-auto"
            style={{ background: 'var(--bg-input)', color: 'var(--text-muted)' }}>
            {error.message || 'Unknown error'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={this.handleGoHome}
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold cursor-pointer transition-all"
              style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', color: 'var(--text-primary)' }}
            >
              <Home className="w-4 h-4" />
              Go Home
            </button>
            <button
              onClick={this.handleReload}
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-sm font-semibold cursor-pointer transition-all"
              style={{ background: 'linear-gradient(135deg, #00D4AA, #00A882)', color: '#0D0E14' }}
            >
              <RefreshCw className="w-4 h-4" />
              Reload
            </button>
          </div>
        </div>
      </div>
    )
  }
}
