import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('App crashed:', error, info && info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div
        dir="rtl"
        style={{ minHeight: '100vh', background: '#f7f3e9', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, fontFamily: 'sans-serif' }}
      >
        <div style={{ background: '#fff', borderRadius: 18, padding: 24, maxWidth: 420, width: '100%', textAlign: 'center', boxShadow: '0 2px 14px rgba(31,75,63,.08)' }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1f4b3f', marginBottom: 8 }}>حدث خطأ غير متوقع</div>
          <div style={{ fontSize: 13, color: '#6b6b62', marginBottom: 16, wordBreak: 'break-word' }}>{String(this.state.error && this.state.error.message ? this.state.error.message : this.state.error)}</div>
          <button
            onClick={() => window.location.reload()}
            style={{ background: '#1f4b3f', color: '#fff', border: 'none', borderRadius: 12, padding: '10px 22px', fontSize: 14 }}
          >
            إعادة تحميل التطبيق
          </button>
        </div>
      </div>
    )
  }
}
