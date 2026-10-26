import React, { useState } from 'react'
import ModalShell from './ModalShell.jsx'
import ModalTitle from './ModalTitle.jsx'
import ModalActions from './ModalActions.jsx'
import { PLAN_PRICES } from '../lib/config'
import { planLabel } from '../lib/utils'

export default function ManualActivateModal({ t, target, busy, onClose, onActivate }) {
  const previousPlan = target.sub && (target.sub.plan === 'monthly' || target.sub.plan === 'quarterly' || target.sub.plan === 'yearly') ? target.sub.plan : null
  const [plan, setPlan] = useState(previousPlan || 'monthly')

  function planBtn(key, label, price) {
    return (
      <button
        type="button"
        onClick={() => setPlan(key)}
        style={{
          position: 'relative',
          padding: '14px 10px',
          borderRadius: 'var(--radius-btn)',
          textAlign: 'center',
          cursor: 'pointer',
          border: plan === key ? '2px solid var(--green-dark)' : '1px solid var(--border-soft)',
          background: plan === key ? 'var(--green-pale)' : '#fff'
        }}
      >
        {previousPlan === key && (
          <span
            style={{
              position: 'absolute',
              top: -9,
              insetInlineStart: '50%',
              transform: 'translateX(-50%)',
              background: 'var(--amber)',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 10
            }}
          >
            {t.previousBadge}
          </span>
        )}
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green-dark)' }}>{label}</div>
        <div style={{ fontSize: 17, fontWeight: 700, marginTop: 4 }}>${price}</div>
      </button>
    )
  }

  return (
    <ModalShell onClose={onClose}>
      <ModalTitle icon="fa-bolt" text={t.manualActivate} onClose={onClose} />
      <p style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 4 }}>{t.activatingFor}</p>
      <p style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--green-dark)', marginBottom: 10 }}>{target.email}</p>

      <div
        style={{
          background: 'var(--green-pale)',
          borderRadius: 'var(--radius-btn)',
          padding: '10px 14px',
          marginBottom: 18,
          fontSize: 12.5,
          color: 'var(--text-sub)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}
      >
        <i className="fa-solid fa-clock-rotate-left" style={{ color: 'var(--green-dark)' }}></i>
        <span>
          {t.previousPlanLabel}: <strong style={{ color: 'var(--green-dark)' }}>{previousPlan ? planLabel(t, previousPlan) : t.noPreviousPlan}</strong>
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 20 }}>
        {planBtn('monthly', t.monthlyPlan, PLAN_PRICES.monthly)}
        {planBtn('quarterly', t.quarterlyPlan, PLAN_PRICES.quarterly)}
        {planBtn('yearly', t.yearlyPlan, PLAN_PRICES.yearly)}
      </div>

      <ModalActions t={t} onClose={onClose} onSave={() => onActivate(plan)} saveLabel={t.manualActivate} disabled={busy} />
    </ModalShell>
  )
}
