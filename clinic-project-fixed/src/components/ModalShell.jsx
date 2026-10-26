import React from 'react'

export default function ModalShell({ onClose, children, wide }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(31,42,38,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 500,
        padding: 16
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="pop-in"
        style={{
          background: 'var(--card-white)',
          borderRadius: 'var(--radius-card)',
          padding: '26px 24px',
          width: '100%',
          maxWidth: wide ? 520 : 420,
          maxHeight: '88vh',
          overflowY: 'auto'
        }}
      >
        {children}
      </div>
    </div>
  )
}
