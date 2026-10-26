import React from 'react'
import { secondaryBtnStyle, primaryBtnStyle } from '../lib/sharedStyles'

export default function ModalActions({ t, onClose, onSave, saveLabel, disabled }) {
  return (
    <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
      <button type="button" onClick={onClose} disabled={disabled} style={{ ...secondaryBtnStyle, flex: 1, opacity: disabled ? 0.6 : 1 }}>
        {t.cancel}
      </button>
      <button type="button" onClick={onSave} disabled={disabled} style={{ ...primaryBtnStyle, flex: 1, opacity: disabled ? 0.6 : 1 }}>
        {disabled ? '...' : saveLabel || t.confirm}
      </button>
    </div>
  )
}
