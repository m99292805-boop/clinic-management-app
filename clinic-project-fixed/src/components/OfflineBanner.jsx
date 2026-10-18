import React, { useState, useEffect } from 'react'

export default function OfflineBanner({ t }) {
  const [isOffline, setIsOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine)

  useEffect(() => {
    function handleOnline() {
      setIsOffline(false)
    }
    function handleOffline() {
      setIsOffline(true)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div
      style={{
        background: 'var(--red)',
        color: '#fff',
        textAlign: 'center',
        padding: '8px 12px',
        fontSize: 12.5,
        fontWeight: 600,
        position: 'sticky',
        top: 0,
        zIndex: 400
      }}
    >
      <i className="fa-solid fa-wifi" style={{ marginInlineEnd: 6 }}></i>
      {t.offlineNotice}
    </div>
  )
}
