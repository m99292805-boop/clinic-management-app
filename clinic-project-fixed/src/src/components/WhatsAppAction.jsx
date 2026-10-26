import React from 'react'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard'

export default function WhatsAppAction({ t, link, phone, label }) {
  const { copiedValue, copyFailed, copy } = useCopyToClipboard()
  const copied = copiedValue === phone

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: '#25D366',
          color: '#fff',
          padding: '11px 20px',
          borderRadius: 'var(--radius-btn)',
          fontSize: 13.5,
          fontWeight: 700,
          textDecoration: 'none'
        }}
      >
        <i className="fa-brands fa-whatsapp" style={{ fontSize: 16 }}></i>
        <span>{label}</span>
      </a>
      <button
        type="button"
        onClick={() => copy(phone)}
        style={{
          background: 'transparent',
          border: 'none',
          color: copyFailed ? 'var(--red)' : 'var(--text-sub)',
          fontSize: 11.5,
          cursor: 'pointer',
          textDecoration: 'underline',
          padding: 0
        }}
      >
        {copyFailed ? t.clipboardError : copied ? t.codeCopied : t.whatsappWrongAppHint}
      </button>
    </div>
  )
}
