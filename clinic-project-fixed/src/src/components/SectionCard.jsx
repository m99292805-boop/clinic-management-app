import React from 'react'
import { cardStyle, primaryBtnStyle } from '../lib/sharedStyles'

export default function SectionCard({ title, icon, actionLabel, onAction, children }) {
  return (
    <div style={{ ...cardStyle, marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: 'var(--green-dark)' }}>
          <i className={'fa-solid ' + icon}></i>
          <span>{title}</span>
        </div>
        <button onClick={onAction} style={{ ...primaryBtnStyle, padding: '7px 14px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="fa-solid fa-plus"></i>
          <span>{actionLabel}</span>
        </button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{children}</div>
    </div>
  )
}
