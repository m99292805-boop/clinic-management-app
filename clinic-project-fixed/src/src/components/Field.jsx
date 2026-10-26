import React from 'react'

export default function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-sub)', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}
