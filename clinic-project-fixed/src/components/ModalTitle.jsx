import React from 'react'
import { iconBtnStyle } from '../lib/sharedStyles'

export default function ModalTitle({ icon, text, onClose }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 17, fontWeight: 700, color: 'var(--green-dark)' }}>
        <i className={'fa-solid ' + icon}></i>
        <span>{text}</span>
      </div>
      <button onClick={onClose} style={{ ...iconBtnStyle, border: 'none' }}>
        <i className="fa-solid fa-xmark"></i>
      </button>
    </div>
  )
}
