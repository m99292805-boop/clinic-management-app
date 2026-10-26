import React, { useState } from 'react'
import { cardStyle, secondaryBtnStyle, dangerBtnStyle } from '../lib/sharedStyles'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard'

export default function AgentsPanel({ t, agentStats, onDeleteAgent }) {
  const [confirmId, setConfirmId] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const { copiedValue: copiedCode, copyFailed, copy } = useCopyToClipboard(1500)

  return (
    <div>
      {agentStats.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--text-sub)', padding: '24px' }}>{t.noAgentsYet}</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {agentStats.map(({ agent, doctors, earned }) => {
            const paidCount = doctors.filter((d) => d.isPaid).length
            return (
              <div key={agent.id} style={cardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>{agent.name}</div>
                    {agent.phone && <div style={{ fontSize: 11.5, color: 'var(--text-sub)' }}>{agent.phone}</div>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        background: 'var(--bg-cream)',
                        border: '1.5px dashed var(--green-mid)',
                        borderRadius: 8,
                        padding: '6px 12px',
                        fontWeight: 800,
                        fontSize: 15,
                        letterSpacing: 1.5,
                        direction: 'ltr'
                      }}
                    >
                      {agent.code}
                    </div>
                    <button type="button" onClick={() => copy(agent.code)} style={{ ...secondaryBtnStyle, padding: '8px 12px' }} title={copyFailed ? t.clipboardError : ''}>
                      <i className={'fa-solid ' + (copyFailed ? 'fa-triangle-exclamation' : copiedCode === agent.code ? 'fa-check' : 'fa-copy')}></i>
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12.5, flexWrap: 'wrap' }}>
                  <span>
                    <i className="fa-solid fa-user-doctor" style={{ marginInlineEnd: 5, color: 'var(--green-mid)' }}></i>
                    {t.agentDoctorsCount}: <strong>{doctors.length}</strong>
                  </span>
                  <span>
                    <i className="fa-solid fa-circle-check" style={{ marginInlineEnd: 5, color: 'var(--green-dark)' }}></i>
                    {t.agentPaidCount}: <strong>{paidCount}</strong>
                  </span>
                  <span>
                    <i className="fa-solid fa-sack-dollar" style={{ marginInlineEnd: 5, color: 'var(--amber)' }}></i>
                    {t.totalEarned}: <strong>${earned}</strong>
                  </span>
                </div>
                {onDeleteAgent && (
                  <div style={{ marginTop: 12 }}>
                    {confirmId === agent.id ? (
                      <div style={{ background: 'var(--bg-cream)', borderRadius: 10, padding: 12 }}>
                        <p style={{ fontSize: 12.5, lineHeight: 1.7, marginBottom: 10 }}>{t.deleteAgentConfirm}</p>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button type="button" disabled={busyId === agent.id} onClick={() => setConfirmId(null)} style={{ ...secondaryBtnStyle, flex: 1, padding: '8px 12px', fontSize: 12.5 }}>
                            {t.cancel}
                          </button>
                          <button
                            type="button"
                            disabled={busyId === agent.id}
                            onClick={async () => {
                              setBusyId(agent.id)
                              const ok = await onDeleteAgent(agent.id)
                              setBusyId(null)
                              if (ok) setConfirmId(null)
                            }}
                            style={{ ...dangerBtnStyle, flex: 1, padding: '8px 12px', fontSize: 12.5, opacity: busyId === agent.id ? 0.6 : 1 }}
                          >
                            {busyId === agent.id ? '...' : t.deleteAgentBtn}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button type="button" onClick={() => setConfirmId(agent.id)} style={{ ...dangerBtnStyle, padding: '6px 12px', fontSize: 12 }}>
                        <i className="fa-solid fa-trash" style={{ marginInlineEnd: 6 }}></i>
                        {t.deleteAgentBtn}
                      </button>
                    )}
                  </div>
                )}
                {doctors.length > 0 && (
                  <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--text-sub)' }}>
                    {doctors.map((d) => `${d.fullName || d.email}${d.isPaid ? ' ✅' : ''}`).join('، ')}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
