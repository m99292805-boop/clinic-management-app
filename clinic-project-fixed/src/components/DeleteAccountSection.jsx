import React, { useState } from 'react'
import { inputStyle, secondaryBtnStyle, dangerBtnStyle } from '../lib/sharedStyles'

// حذف الحساب نهائياً (مطلوب من Google Play): تأكيد بكلمة السر، والتحقق منها في الخادم.
export default function DeleteAccountSection({ t, onDelete }) {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function confirmDelete() {
    if (busy) return
    if (!password) {
      setError(t.fillRequired)
      return
    }
    setBusy(true)
    setError('')
    const res = await onDelete(password)
    setBusy(false)
    if (!res || !res.ok) {
      setError((res && res.error) || t.saveError)
    }
  }

  return (
    <div style={{ border: '1px solid var(--red)', borderRadius: 12, padding: '16px 18px', marginTop: 22, background: 'var(--red-bg)' }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--red)', marginBottom: 8 }}>
        <i className="fa-solid fa-triangle-exclamation" style={{ marginInlineEnd: 6 }}></i>
        {t.deleteMyAccountTitle}
      </div>
      <p style={{ fontSize: 12.5, lineHeight: 1.7, marginBottom: 12 }}>{t.deleteMyAccountWarn}</p>
      {open ? (
        <div>
          <input
            type="password"
            autoComplete="current-password"
            placeholder={t.currentPassword}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...inputStyle, marginBottom: 10 }}
          />
          {error && <p style={{ color: 'var(--red)', fontSize: 12.5, marginBottom: 10 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                setOpen(false)
                setPassword('')
                setError('')
              }}
              style={{ ...secondaryBtnStyle, flex: 1 }}
            >
              {t.cancel}
            </button>
            <button type="button" disabled={busy} onClick={confirmDelete} style={{ ...dangerBtnStyle, flex: 1, opacity: busy ? 0.6 : 1 }}>
              {busy ? '...' : t.deleteMyAccountConfirm}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} style={dangerBtnStyle}>
          <i className="fa-solid fa-trash" style={{ marginInlineEnd: 6 }}></i>
          {t.deleteMyAccountBtn}
        </button>
      )}
    </div>
  )
}
