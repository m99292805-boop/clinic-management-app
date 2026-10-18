import React, { useState } from 'react'
import LangSwitch from './LangSwitch.jsx'
import ModalShell from './ModalShell.jsx'
import ModalTitle from './ModalTitle.jsx'
import { iconBtnStyle, secondaryBtnStyle } from '../lib/sharedStyles'
import { useAuth } from '../hooks/useAuth.jsx'
import { monthIncome, currencySymbol, newPatientsThisMonth, collectionRate } from '../lib/utils'

export default function TopBar({ t, lang, setLang, session, specialty, patients, onLogout, onSettings, onLogo }) {
  const [showIncome, setShowIncome] = useState(false)
  const { activeClinicLogo } = useAuth()
  return (
    <div style={{ background: 'var(--card-white)', borderBottom: '1px solid var(--border-soft)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={onLogo}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
            {activeClinicLogo ? (
              <img src={activeClinicLogo} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }} />
            ) : (
              <i className={'fa-solid ' + specialty.icon} style={{ fontSize: 18, color: 'var(--green-dark)' }}></i>
            )}
          </div>
          <div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--green-dark)' }}>{specialty.name[lang]}</div>
            <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>
              {session.isSecretary ? (
                <>
                  <i className="fa-solid fa-user-tie" style={{ marginInlineEnd: 4, color: 'var(--green-mid)' }}></i>
                  {t.secretaryBadgePrefix} {session.secretaryName}
                </>
              ) : (
                <>
                  {t.doctor} {session.email.split('@')[0]}
                </>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setShowIncome(true)} title={t.statisticsTitle} style={iconBtnStyle}>
            <i className="fa-solid fa-sack-dollar"></i>
          </button>
          <LangSwitch lang={lang} setLang={setLang} t={t} />
          {!session.isSecretary && (
            <button onClick={onSettings} title={t.settings} style={iconBtnStyle}>
              <i className="fa-solid fa-gear"></i>
            </button>
          )}
          <button onClick={onLogout} style={{ ...secondaryBtnStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="fa-solid fa-arrow-right-from-bracket"></i>
            <span>{t.logout}</span>
          </button>
        </div>
      </div>
      {showIncome && <IncomeModal t={t} lang={lang} patients={patients} onClose={() => setShowIncome(false)} />}
    </div>
  )
}

function IncomeModal({ t, patients, onClose }) {
  const thisMonth = monthIncome(patients, 0)
  const lastMonth = monthIncome(patients, -1)
  const newPatients = newPatientsThisMonth(patients)
  const rate = collectionRate(patients)

  function renderAmounts(byCurrency) {
    const entries = Object.entries(byCurrency)
    if (entries.length === 0) return <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--green-dark)' }}>$0</div>
    return entries.map(([cur, amt]) => (
      <div key={cur} style={{ fontSize: entries.length > 1 ? 18 : 24, fontWeight: 700, color: 'var(--green-dark)', direction: 'ltr' }}>
        {amt.toLocaleString()} {currencySymbol(cur)}
      </div>
    ))
  }
  return (
    <ModalShell onClose={onClose}>
      <ModalTitle icon="fa-sack-dollar" text={t.statisticsTitle} onClose={onClose} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <div style={{ background: 'var(--green-pale)', borderRadius: 'var(--radius-btn)', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 8 }}>{t.monthIncome}</div>
          {renderAmounts(thisMonth)}
        </div>
        <div style={{ background: 'var(--green-pale)', borderRadius: 'var(--radius-btn)', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 8 }}>{t.lastMonthIncome}</div>
          {renderAmounts(lastMonth)}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ background: 'var(--bg-cream)', borderRadius: 'var(--radius-btn)', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 8 }}>{t.newPatientsThisMonth}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--green-dark)' }}>{newPatients}</div>
        </div>
        <div style={{ background: 'var(--bg-cream)', borderRadius: 'var(--radius-btn)', padding: '16px', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 8 }}>{t.collectionRate}</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: rate !== null && rate < 70 ? 'var(--amber)' : 'var(--green-dark)' }}>
            {rate !== null ? `${rate}%` : '—'}
          </div>
        </div>
      </div>
    </ModalShell>
  )
}
