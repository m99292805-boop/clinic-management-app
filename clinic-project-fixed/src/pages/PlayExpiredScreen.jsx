import React, { useState, useEffect } from 'react'
import LangSwitch from '../components/LangSwitch.jsx'
import { ADMIN_WHATSAPP } from '../lib/config'
import { cardStyle, secondaryBtnStyle, primaryBtnStyle } from '../lib/sharedStyles'

// نسخة Google Play: رسالة بسيطة بدون أي أسعار أو باقات أو طرق دفع أو روابط دفع (وفق سياسة المدفوعات)
export default function PlayExpiredScreen({ t, lang, setLang, session, specialty, onLogout, onRefresh }) {
  const [refreshing, setRefreshing] = useState(false)
  // إذا فعّل الأدمن الاشتراك من الخارج ينفتح التطبيق تلقائياً (فحص كل 15 ثانية)
  useEffect(() => {
    if (!onRefresh) return undefined
    const id = setInterval(() => {
      onRefresh()
    }, 15000)
    return () => clearInterval(id)
  }, [onRefresh])
  async function handleRefresh() {
    if (!onRefresh || refreshing) return
    setRefreshing(true)
    await onRefresh()
    setRefreshing(false)
  }
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-cream)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: 960, width: '100%', margin: '0 auto', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13.5, color: 'var(--text-sub)' }}>{session.email}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LangSwitch lang={lang} setLang={setLang} t={t} />
          <button onClick={onLogout} style={secondaryBtnStyle}>
            {t.logout}
          </button>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ ...cardStyle, maxWidth: 420, width: '100%', textAlign: 'center', padding: '28px 22px' }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--amber-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
            <i className="fa-solid fa-hourglass-end" style={{ fontSize: 24, color: 'var(--amber)' }}></i>
          </div>
          <h1 style={{ fontSize: 19, fontWeight: 700, margin: '0 0 8px', color: 'var(--green-dark)' }}>{t.playExpiredTitle}</h1>
          <p style={{ fontSize: 13.5, color: 'var(--text-sub)', lineHeight: 1.8, marginBottom: 18 }}>{t.playExpiredBody}</p>
          <p style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 18, direction: 'ltr' }}>{lang === 'ar' ? 'الدعم' : 'Support'} (WhatsApp): {ADMIN_WHATSAPP}</p>
          <button type="button" disabled={refreshing} onClick={handleRefresh} style={{ ...primaryBtnStyle, opacity: refreshing ? 0.6 : 1 }}>
            <i className={'fa-solid ' + (refreshing ? 'fa-circle-notch fa-spin' : 'fa-rotate')} style={{ marginInlineEnd: 8 }}></i>
            {t.playRefresh}
          </button>
        </div>
      </div>
    </div>
  )
}
