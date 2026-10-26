import React from 'react'
import ModalShell from './ModalShell.jsx'
import ModalTitle from './ModalTitle.jsx'
import { isExpired, daysLeft, planLabel, formatMoneyLines } from '../lib/utils'
import { PLAN_PRICES } from '../lib/config'

function Row({ icon, label, children }) {
  if (children === null || children === undefined || children === '' || children === false) return null
  return (
    <div style={{ display: 'flex', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border-soft)', alignItems: 'flex-start' }}>
      <i className={'fa-solid ' + icon} style={{ color: 'var(--green-mid)', fontSize: 13, width: 18, marginTop: 3, textAlign: 'center' }}></i>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 11.5, color: 'var(--text-sub)', marginBottom: 1 }}>{label}</div>
        <div style={{ fontSize: 13.5, fontWeight: 600, wordBreak: 'break-word' }}>{children}</div>
      </div>
    </div>
  )
}

function Stat({ label, value, color }) {
  return (
    <div style={{ background: 'var(--bg-cream)', borderRadius: 12, padding: '10px 12px', minWidth: 0 }}>
      <div style={{ fontSize: 11.5, color: 'var(--text-sub)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: color || 'var(--text-main)', whiteSpace: 'pre-line', direction: 'ltr', textAlign: 'start', wordBreak: 'break-word' }}>{value}</div>
    </div>
  )
}

export default function DoctorDetailsModal({ t, lang, entry, agentName, createdAt, overview, onClose }) {
  const ar = lang === 'ar'
  const sub = entry.sub
  const revoked = sub.status === 'revoked'
  const expired = isExpired(sub)
  const statusLabel = revoked ? t.revoked : expired ? t.expired : sub.plan === 'trial' ? t.trial : t.active
  const statusColor = revoked || expired ? 'var(--red)' : sub.plan === 'trial' ? 'var(--amber)' : 'var(--green-mid)'
  const statusBg = revoked || expired ? 'var(--red-bg)' : sub.plan === 'trial' ? 'var(--amber-bg)' : 'var(--green-light)'
  const left = !expired && sub.endDate ? daysLeft(sub) : null
  const locale = ar ? 'ar-SY' : 'en-GB'
  const fmtDate = (v) => {
    if (!v) return null
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString(locale)
  }
  const fmtDateTime = (v) => {
    if (!v) return null
    const d = new Date(v)
    return Number.isNaN(d.getTime()) ? null : d.toLocaleString(locale)
  }
  const ov = overview || { patients: 0, sessions: 0, billed: {}, collected: {}, lastActivity: null }

  return (
    <ModalShell onClose={onClose} wide>
      <ModalTitle icon="fa-user-doctor" text={t.ddTitle} onClose={onClose} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={'fa-solid ' + (entry.specialty ? entry.specialty.icon : 'fa-user-doctor')} style={{ fontSize: 19, color: 'var(--green-dark)' }}></i>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--green-dark)', wordBreak: 'break-word' }}>{entry.fullName || entry.email}</div>
          {entry.fullName && <div style={{ fontSize: 12.5, color: 'var(--text-sub)', direction: 'ltr', textAlign: 'start', wordBreak: 'break-all' }}>{entry.email}</div>}
        </div>
        <span style={{ marginInlineStart: 'auto', fontSize: 11.5, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: statusBg, color: statusColor, flexShrink: 0 }}>{statusLabel}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        <Stat label={t.ddPatients} value={String(ov.patients)} color="var(--green-dark)" />
        <Stat label={t.ddSessions} value={String(ov.sessions)} color="var(--green-dark)" />
        <Stat label={t.ddBilled} value={formatMoneyLines(ov.billed, { joiner: '\n' })} />
        <Stat label={t.ddCollected} value={formatMoneyLines(ov.collected, { joiner: '\n' })} color="var(--green-mid)" />
      </div>

      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--green-dark)', margin: '4px 0' }}>{t.ddSubscription}</div>
      <Row icon="fa-crown" label={t.ddPlan}>
        {sub.plan ? planLabel(t, sub.plan) : null}
        {sub.plan && PLAN_PRICES[sub.plan] ? ` ($${PLAN_PRICES[sub.plan]})` : ''}
      </Row>
      <Row icon="fa-calendar-plus" label={t.ddStart}>{fmtDate(sub.startDate)}</Row>
      <Row icon="fa-calendar-xmark" label={t.ddEnd}>
        {fmtDate(sub.endDate)}
        {left !== null ? ` — ${left} ${t.ddDaysLeft}` : ''}
      </Row>
      {sub.pendingPlan && (
        <Row icon="fa-hourglass-half" label={t.requestedPlan}>
          {planLabel(t, sub.pendingPlan)} (${PLAN_PRICES[sub.pendingPlan]})
          {sub.pendingRequestedAt ? ` — ${fmtDateTime(sub.pendingRequestedAt)}` : ''}
        </Row>
      )}
      {sub.paymentNote && (
        <Row icon="fa-receipt" label={ar ? 'رقم عملية التحويل' : 'Transfer ref'}>
          <span style={{ direction: 'ltr', display: 'inline-block' }}>{sub.paymentNote}</span>
        </Row>
      )}

      <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--green-dark)', margin: '14px 0 4px' }}>{t.ddAccount}</div>
      <Row icon="fa-phone" label={t.ddPhone}>
        {entry.phone && entry.phone !== '—' ? <span style={{ direction: 'ltr', display: 'inline-block' }}>{entry.phone}</span> : null}
      </Row>
      <Row icon="fa-stethoscope" label={t.ddSpecialty}>{entry.specialty ? entry.specialty.name[lang] : null}</Row>
      <Row icon="fa-user-plus" label={t.ddSignup}>{fmtDate(createdAt)}</Row>
      <Row icon="fa-clock-rotate-left" label={t.ddLastActivity}>{fmtDateTime(ov.lastActivity) || t.ddNone}</Row>
      <Row icon="fa-user-tie" label={t.ddSecretary}>{entry.secretaryName}</Row>
      <Row icon="fa-ticket" label={t.ddReferralCode}>
        {entry.referralCode ? <span style={{ direction: 'ltr', display: 'inline-block', letterSpacing: 1 }}>{entry.referralCode}</span> : null}
      </Row>
      <Row icon="fa-share-nodes" label={t.referredByLabel}>{entry.referredBy ? entry.referredBy.email : null}</Row>
      <Row icon="fa-users" label={t.referredDoctorsCount}>
        {entry.referredDoctors.length > 0 ? `${entry.referredDoctors.length}: ${entry.referredDoctors.map((r) => r.fullName || r.email).join('، ')}` : null}
      </Row>
      <Row icon="fa-people-group" label={t.ddAgent}>{agentName}</Row>

      <p style={{ fontSize: 11.5, color: 'var(--text-sub)', lineHeight: 1.7, marginTop: 14, background: 'var(--bg-cream)', borderRadius: 10, padding: '9px 12px' }}>
        <i className="fa-solid fa-lock" style={{ marginInlineEnd: 6 }}></i>
        {t.ddPrivacyNote}
      </p>
    </ModalShell>
  )
}
