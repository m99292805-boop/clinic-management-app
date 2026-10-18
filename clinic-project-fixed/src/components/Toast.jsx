import React from 'react'

export default function Toast({ message }) {
  if (!message) return null
  return (
    <div
      className="pop-in"
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--green-dark)',
        color: '#fff',
        padding: '12px 22px',
        borderRadius: '30px',
        fontSize: 14,
        fontWeight: 500,
        boxShadow: '0 6px 20px rgba(0,0,0,0.15)',
        zIndex: 999
      }}
    >
      {message}
    </div>
  )
}
