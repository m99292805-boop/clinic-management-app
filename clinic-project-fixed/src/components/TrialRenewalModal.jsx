import React, { useState } from 'react'
import ModalShell from './ModalShell.jsx'
import ModalTitle from './ModalTitle.jsx'
import PlanCard from './PlanCard.jsx'
import WhatsAppAction from './WhatsAppAction.jsx'
import { PLAN_PRICES, SHAMCASH_QR, SHAMCASH_HOLDER, SHAMCASH_CODE, ADMIN_WHATSAPP } from '../lib/config'
import { buildWhatsappLink } from '../lib/utils'

export default function TrialRenewalModal({ t, lang, session, specialty, onClose, onChoose }) {
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const specialtyLabel = specialty ? specialty.name[lang] : ''
  const waLink = selectedPlan ? buildWhatsappLink(session.email, selectedPlan, specialtyLabel, lang) : null

  // ما نعرض شاشة الدفع إلا بعد ما السيرفر يأكد إنه الطلب وصل للأدمن
  async function handlePick(plan) {
    if (busy) return
    setBusy(true)
    setError('')
    const ok = await onChoose(plan)
    setBusy(false)
    if (ok) setSelectedPlan(plan)
    else setError(lang === 'ar' ? 'تعذّر إرسال الطلب للأدمن. تأكد من الإنترنت وحاول مرة ثانية.' : "Couldn't send the request to the admin. Check your internet and try again.")
  }

  return (
    <ModalShell onClose={onClose}>
      <ModalTitle icon="fa-hourglass-half" text={t.renewNow} onClose={onClose} />
      {error && <div style={{ background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</div>}
      {!selectedPlan ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, opacity: busy ? 0.6 : 1, pointerEvents: busy ? 'none' : 'auto' }}>
          <PlanCard t={t} title={t.monthlyPlan} price={PLAN_PRICES.monthly} suffix={t.perMonth} onChoose={() => handlePick('monthly')} />
          <PlanCard t={t} title={t.quarterlyPlan} price={PLAN_PRICES.quarterly} suffix={t.perQuarter} onChoose={() => handlePick('quarterly')} />
          <PlanCard
            t={t}
            title={t.yearlyPlan}
            price={PLAN_PRICES.yearly}
            suffix={t.perYear}
            highlight
            badge={t.bestValue}
            onChoose={() => handlePick('yearly')}
          />
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
          <div style={{ background: 'var(--green-light)', color: 'var(--green-dark)', borderRadius: 10, padding: '9px 12px', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
            <i className="fa-solid fa-circle-check" style={{ marginInlineEnd: 6 }}></i>
            {lang === 'ar' ? 'تم إرسال طلبك للأدمن' : 'Your request was sent to the admin'}
          </div>
          <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>
            {lang === 'ar' ? `ادفع $${PLAN_PRICES[selectedPlan]} عبر شام كاش` : `Pay $${PLAN_PRICES[selectedPlan]} via Sham Cash`}
          </p>
          <img src={SHAMCASH_QR} alt="Sham Cash QR" style={{ width: 180, height: 'auto', borderRadius: 14, border: '1px solid var(--border-soft)', marginBottom: 12 }} />
          <div style={{ background: 'var(--bg-cream)', borderRadius: 10, padding: '10px 12px', marginBottom: 10, textAlign: lang === 'ar' ? 'right' : 'left' }}>
            <div style={{ fontSize: 11.5, color: 'var(--text-sub)', marginBottom: 2 }}>{lang === 'ar' ? 'اسم صاحب الحساب' : 'Account holder'}</div>
            <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8 }}>{SHAMCASH_HOLDER}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-sub)', marginBottom: 2 }}>{lang === 'ar' ? 'رمز الحساب' : 'Account code'}</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, wordBreak: 'break-all', direction: 'ltr', textAlign: 'center' }}>{SHAMCASH_CODE}</div>
          </div>
          <p style={{ fontSize: 12.5, color: 'var(--text-sub)', marginBottom: 16, lineHeight: 1.7 }}>
            {lang === 'ar'
              ? 'بعد الدفع، أرسل صورة إشعار التحويل عبر واتساب ليتم تفعيل اشتراكك.'
              : 'After paying, send a screenshot of the transfer receipt via WhatsApp to activate your subscription.'}
          </p>
          <WhatsAppAction t={t} lang={lang} link={waLink} phone={ADMIN_WHATSAPP} label={t.sendViaWhatsapp} />
        </div>
      )}
    </ModalShell>
  )
}
