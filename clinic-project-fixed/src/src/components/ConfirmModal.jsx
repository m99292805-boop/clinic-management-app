import React from 'react'
import ModalShell from './ModalShell.jsx'
import { secondaryBtnStyle, dangerBtnStyle } from '../lib/sharedStyles'

export default function ConfirmModal({ t, message, onCancel, onConfirm }) {
  return (
    <ModalShell onClose={onCancel}>
      <div style={{ textAlign: 'center', padding: '10px 0' }}>
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'var(--red-bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px'
          }}
        >
          <i className="fa-solid fa-triangle-exclamation" style={{ color: 'var(--red)', fontSize: 20 }}></i>
        </div>
        <p style={{ fontSize: 14.5, lineHeight: 1.7, marginBottom: 22 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ ...secondaryBtnStyle, flex: 1 }}>
            {t.cancel}
          </button>
          <button onClick={onConfirm} style={{ ...dangerBtnStyle, flex: 1 }}>
            {t.confirm}
          </button>
        </div>
      </div>
    </ModalShell>
  )
}
