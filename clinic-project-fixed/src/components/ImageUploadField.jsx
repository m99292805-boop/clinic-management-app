import React, { useRef } from 'react'

export default function ImageUploadField({ label, value, onChange, onRemove }) {
  const inputId = useRef('img_' + Math.random().toString(36).slice(2)).current
  return (
    <div>
      <label style={{ display: 'block', fontSize: 12.5, fontWeight: 600, color: 'var(--text-sub)', marginBottom: 6 }}>{label}</label>
      {value ? (
        <div style={{ position: 'relative' }}>
          <img src={value} alt={label} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 'var(--radius-btn)', border: '1px solid var(--border-soft)' }} />
          <button
            type="button"
            onClick={onRemove}
            style={{
              position: 'absolute',
              top: 6,
              insetInlineEnd: 6,
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.55)',
              color: '#fff',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12
            }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            height: 100,
            borderRadius: 'var(--radius-btn)',
            border: '1.5px dashed var(--border-soft)',
            background: '#FCFBF6',
            cursor: 'pointer',
            color: 'var(--text-sub)'
          }}
        >
          <i className="fa-solid fa-camera" style={{ fontSize: 18 }}></i>
          <span style={{ fontSize: 11.5 }}>{label}</span>
        </label>
      )}
      <input id={inputId} type="file" accept="image/*" onChange={onChange} style={{ display: 'none' }} />
    </div>
  )
}
