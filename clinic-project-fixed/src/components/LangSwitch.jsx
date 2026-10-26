import React from 'react'

export default function LangSwitch({ lang, setLang }) {
  return (
    <div style={{ display: 'flex', border: '1px solid var(--border-soft)', borderRadius: 10, overflow: 'hidden' }}>
      <button
        onClick={() => setLang('ar')}
        style={{
          padding: '6px 12px',
          fontSize: 12.5,
          fontWeight: 600,
          border: 'none',
          background: lang === 'ar' ? 'var(--green-dark)' : 'transparent',
          color: lang === 'ar' ? '#fff' : 'var(--text-sub)'
        }}
      >
        عربي
      </button>
      <button
        onClick={() => setLang('en')}
        style={{
          padding: '6px 12px',
          fontSize: 12.5,
          fontWeight: 600,
          border: 'none',
          background: lang === 'en' ? 'var(--green-dark)' : 'transparent',
          color: lang === 'en' ? '#fff' : 'var(--text-sub)'
        }}
      >
        EN
      </button>
    </div>
  )
}
