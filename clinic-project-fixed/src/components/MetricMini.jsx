import React from 'react'

export default function MetricMini({ label, value, color }) {
  return (
    <div style={{ background: 'var(--green-pale)', borderRadius: 12, padding: '10px 12px', textAlign: 'center' }}>
      <div style={{ fontSize: 11, color: 'var(--text-sub)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: String(value).includes('\n') ? 13 : 16, fontWeight: 700, color, whiteSpace: 'pre-line', direction: 'ltr', wordBreak: 'break-word' }}>{value}</div>
    </div>
  )
}
