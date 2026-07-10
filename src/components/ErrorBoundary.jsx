import { Component } from 'react'

// Catches any render/runtime error in the tree and shows a recoverable screen
// instead of a blank white page. The user's data lives in localStorage, so it's
// untouched — a reload almost always brings everything back.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Surface it in the console for debugging.
    console.error('App error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-screen">
          <div className="error-card">
            <div className="error-emoji" aria-hidden="true">😵‍💫</div>
            <h1>Something went wrong</h1>
            <p>The app hit an unexpected error. Don’t worry — your saved data is safe on this device.</p>
            <p className="error-detail">{String(this.state.error?.message || this.state.error)}</p>
            <button type="button" className="primary-btn" onClick={() => window.location.reload()}>
              Reload the app
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
