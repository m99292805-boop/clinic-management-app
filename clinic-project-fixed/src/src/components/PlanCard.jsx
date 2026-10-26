import React from 'react'
import { cardStyle, primaryBtnStyle } from '../lib/sharedStyles'

export default function PlanCard({ t, title, price, suffix, onChoose, highlight, badge }) {
  return (
    <div
      style={{
        ...cardStyle,
        textAlign: 'center',
        position: 'relative',
        border: highlight ? '2px solid var(--green-dark)' : '1px solid var(--border-soft)'
      }}
    >
      {badge && (
        <div
          style={{
            position: 'absolute',
            top: -11,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'var(--green-dark)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 700,
            padding: '3px 12px',
            borderRadius: 20
          }}
        >
          {badge}
        </div>
      )}
      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text-sub)', marginTop: 6, marginBottom: 10 }}>{title}</div>
      <div style={{ marginBottom: 16 }}>
        <span style={{ fontSize: 30, fontWeight: 700, color: 'var(--green-dark)' }}>${price}</span>
        <span style={{ fontSize: 12.5, color: 'var(--text-sub)' }}>{suffix}</span>
      </div>
      <button type="button" onClick={onChoose} style={{ ...primaryBtnStyle, width: '100%' }}>
        {t.choosePlan}
      </button>
    </div>
  )
}
