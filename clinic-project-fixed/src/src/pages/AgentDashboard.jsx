import React from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import LangSwitch from '../components/LangSwitch.jsx'
import { cardStyle, secondaryBtnStyle } from '../lib/sharedStyles'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard'
import DeleteAccountSection from '../components/DeleteAccountSection.jsx'

export default function AgentDashboard() {
  const { t, lang, setLang, agentData, agentRewards, handleLogout, deleteMyAccount } = useAuth()
  const { copiedValue, copyFailed, copy } = useCopyToClipboard()
  const copied = copiedValue === agentData.code

  const totalEarned = agentRewards.reduce((s, r) => s + Number(r.amount || 0), 0)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-cream)' }}>
      <div style={{ background: 'var(--card-white)', borderBottom: '1px solid var(--border-soft)', padding: '14px 20px' }}>
        <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--amber)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fa-solid fa-people-group" style={{ color: '#fff', fontSize: 16 }}></i>
            </div>
            <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--green-dark)' }}>{agentData.name}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LangSwitch lang={lang} setLang={setLang} t={t} />
            <button onClick={handleLogout} style={secondaryBtnStyle}>
              {t.logout}
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '24px 16px 60px' }}>
        <div style={{ ...cardStyle, textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 12.5, color: 'var(--text-sub)', marginBottom: 10 }}>{t.myAgentCode}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 }}>
            <div
              style={{
                background: 'var(--bg-cream)',
                border: '1.5px dashed var(--green-mid)',
                borderRadius: 10,
                padding: '12px 24px',
                fontWeight: 800,
                fontSize: 24,
                letterSpacing: 3,
                direction: 'ltr'
              }}
            >
              {agentData.code}
            </div>
            <button type="button" onClick={() => copy(agentData.code)} style={{ ...secondaryBtnStyle, padding: '12px 16px' }}>
              <i className={'fa-solid ' + (copied ? 'fa-check' : 'fa-copy')}></i>
            </button>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text-sub)', lineHeight: 1.7 }}>{t.agentDashboardHint}</p>
          {copyFailed && <p style={{ fontSize: 11.5, color: 'var(--red)', marginTop: 6 }}>{t.clipboardError}</p>}
        </div>

        <div style={{ ...cardStyle, textAlign: 'center', marginBottom: 20, background: 'var(--green-pale)' }}>
          <div style={{ fontSize: 12.5, color: 'var(--text-sub)', marginBottom: 6 }}>{t.totalEarned}</div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--green-dark)' }}>${totalEarned}</div>
        </div>

        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green-dark)', marginBottom: 10 }}>{t.convertedDoctorsTitle}</div>
        {agentRewards.length === 0 ? (
          <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--text-sub)', padding: '24px' }}>{t.noConvertedYet}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {agentRewards.map((r, i) => (
              <div key={i} style={{ ...cardStyle, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{r.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: 'var(--green-mid)', fontWeight: 700 }}>{t.subscribedLabel} ✓</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--green-dark)' }}>+${r.amount}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <DeleteAccountSection t={t} onDelete={deleteMyAccount} />
      </div>
    </div>
  )
}
