import React, { useState, useEffect } from 'react'
import LangSwitch from '../components/LangSwitch.jsx'
import PlanCard from '../components/PlanCard.jsx'
import WhatsAppAction from '../components/WhatsAppAction.jsx'
import { cardStyle, secondaryBtnStyle, primaryBtnStyle, inputStyle } from '../lib/sharedStyles'
import { PLAN_PRICES, SHAMCASH_QR, SHAMCASH_HOLDER, SHAMCASH_CODE, ADMIN_WHATSAPP } from '../lib/config'
import { buildWhatsappLink } from '../lib/utils'

export default function SubscriptionExpiredScreen({ t, lang, setLang, session, specialty, sub, onLogout, onRequestRenewal, onRefresh }) {
  const ar = lang === 'ar'
  const [submitting, setSubmitting] = useState(false)
  const [changing, setChanging] = useState(false) // الطبيب بدو يغيّر الباقة بعد ما طلب
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [noteBusy, setNoteBusy] = useState(false)
  const [noteSaved, setNoteSaved] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const isPending = !!(sub && sub.pendingPlan)
  const isRevoked = !!(sub && sub.status === 'revoked')
  const showPayment = isPending && !changing

  // نفحص كل 15 ثانية: إذا الأدمن وافق، التطبيق بينفتح لحاله بدون ما الطبيب يعمل شي
  useEffect(() => {
    if (!isPending || !onRefresh) return undefined
    const id = setInterval(() => {
      onRefresh()
    }, 15000)
    return () => clearInterval(id)
  }, [isPending, onRefresh])

  async function handleChoose(plan) {
    if (submitting) return
    setSubmitting(true)
    setError('')
    const ok = await onRequestRenewal(plan)
    setSubmitting(false)
    if (ok) {
      setChanging(false)
      setNoteSaved(false)
    } else {
      setError(ar ? 'تعذّر إرسال الطلب للأدمن. تأكد من الإنترنت وحاول مرة ثانية.' : "Couldn't send the request to the admin. Check your internet and try again.")
    }
  }

  async function handleNotify() {
    if (noteBusy || !sub || !sub.pendingPlan) return
    setNoteBusy(true)
    setError('')
    const ok = await onRequestRenewal(sub.pendingPlan, note)
    setNoteBusy(false)
    if (ok) setNoteSaved(true)
    else setError(ar ? 'تعذّر إرسال الإشعار. حاول مرة ثانية.' : "Couldn't send the notification. Try again.")
  }

  async function handleRefresh() {
    if (!onRefresh || refreshing) return
    setRefreshing(true)
    await onRefresh()
    setRefreshing(false)
  }

  const specialtyLabel = specialty ? specialty.name[lang] : ''
  const waPlan = isPending ? sub.pendingPlan : null
  const waLink = waPlan ? buildWhatsappLink(session.email, waPlan, specialtyLabel, lang) : null
  const directWaLink = `https://wa.me/${ADMIN_WHATSAPP.replace('+', '')}`

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-cream)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ maxWidth: 960, width: '100%', margin: '0 auto', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {specialty && (
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--green-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className={'fa-solid ' + specialty.icon} style={{ fontSize: 15, color: 'var(--green-dark)' }}></i>
            </div>
          )}
          <span style={{ fontSize: 13.5, color: 'var(--text-sub)' }}>{session.email}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LangSwitch lang={lang} setLang={setLang} t={t} />
          <button onClick={onLogout} style={secondaryBtnStyle}>
            {t.logout}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div className="fade-in" style={{ width: '100%', maxWidth: 520 }}>
          {isRevoked ? (
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--red-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <i className="fa-solid fa-ban" style={{ fontSize: 24, color: 'var(--red)' }}></i>
              </div>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: 'var(--green-dark)' }}>{t.subscriptionExpiredTitle}</h1>
              <p style={{ fontSize: 13.5, color: 'var(--text-sub)', lineHeight: 1.7, maxWidth: 420, margin: '0 auto' }}>
                {ar ? 'تم إلغاء اشتراكك من قبل إدارة النظام. لتجديده اختر باقة وادفع، وسيصل طلبك للأدمن للمراجعة والتفعيل.' : 'Your subscription was cancelled by the administration. To renew it, choose a plan and pay; your request goes to the admin for review and activation.'}
              </p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--amber-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
                <i className="fa-solid fa-hourglass-end" style={{ fontSize: 24, color: 'var(--amber)' }}></i>
              </div>
              <h1 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 8px', color: 'var(--green-dark)' }}>{t.subscriptionExpiredTitle}</h1>
              <p style={{ fontSize: 13.5, color: 'var(--text-sub)', lineHeight: 1.7, maxWidth: 420, margin: '0 auto' }}>{t.subscriptionExpiredDesc}</p>
            </div>
          )}

          {error && (
            <div style={{ background: 'var(--red-bg)', color: 'var(--red)', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 12, textAlign: 'center' }}>{error}</div>
          )}

          {showPayment ? (
              <div style={{ ...cardStyle, textAlign: 'center', padding: '28px 20px' }}>
                <div style={{ background: 'var(--green-light)', color: 'var(--green-dark)', borderRadius: 10, padding: '9px 12px', fontSize: 13, fontWeight: 700, marginBottom: 14 }}>
                  <i className="fa-solid fa-circle-check" style={{ marginInlineEnd: 6 }}></i>
                  {ar ? 'تم إرسال طلبك للأدمن. بانتظار الموافقة.' : 'Your request was sent to the admin. Waiting for approval.'}
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 14 }}>{ar ? `ادفع $${PLAN_PRICES[waPlan]} عبر شام كاش` : `Pay $${PLAN_PRICES[waPlan]} via Sham Cash`}</p>
                <img src={SHAMCASH_QR} alt="Sham Cash QR" style={{ width: 170, height: 'auto', borderRadius: 14, border: '1px solid var(--border-soft)', marginBottom: 12 }} />
                <div style={{ background: 'var(--bg-cream)', borderRadius: 10, padding: '10px 12px', marginBottom: 10, textAlign: ar ? 'right' : 'left' }}>
                  <div style={{ fontSize: 11.5, color: 'var(--text-sub)', marginBottom: 2 }}>{ar ? 'اسم صاحب الحساب' : 'Account holder'}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8 }}>{SHAMCASH_HOLDER}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--text-sub)', marginBottom: 2 }}>{ar ? 'رمز الحساب' : 'Account code'}</div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, wordBreak: 'break-all', direction: 'ltr', textAlign: 'center' }}>{SHAMCASH_CODE}</div>
                </div>

                <div style={{ textAlign: ar ? 'right' : 'left', marginBottom: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 4 }}>{ar ? 'رقم عملية التحويل (اختياري)' : 'Transfer reference (optional)'}</div>
                  <input
                    type="text"
                    maxLength={100}
                    value={note}
                    onChange={(e) => {
                      setNote(e.target.value)
                      setNoteSaved(false)
                    }}
                    placeholder={ar ? 'مثال: 123456789' : 'e.g. 123456789'}
                    style={{ ...inputStyle, direction: 'ltr' }}
                  />
                </div>
                <button type="button" disabled={noteBusy} onClick={handleNotify} style={{ ...primaryBtnStyle, width: '100%', marginBottom: 10, opacity: noteBusy ? 0.6 : 1 }}>
                  {noteBusy ? '...' : noteSaved ? (ar ? 'تم إشعار الأدمن بالدفع ✓' : 'Admin notified ✓') : ar ? 'دفعت، أشعر الأدمن' : "I've paid — notify admin"}
                </button>

                <p style={{ fontSize: 12.5, color: 'var(--text-sub)', marginBottom: 12, lineHeight: 1.7 }}>
                  {ar ? 'يمكنك أيضاً إرسال صورة إشعار التحويل عبر واتساب لتسريع التفعيل. سيُفتح التطبيق تلقائياً بعد موافقة الأدمن.' : 'You can also send the transfer receipt via WhatsApp to speed things up. The app opens automatically once the admin approves.'}
                </p>
                <WhatsAppAction t={t} lang={lang} link={waLink} phone={ADMIN_WHATSAPP} label={t.sendViaWhatsapp} />
                <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button type="button" disabled={refreshing} onClick={handleRefresh} style={{ ...secondaryBtnStyle, fontSize: 12.5, opacity: refreshing ? 0.6 : 1 }}>
                    <i className={'fa-solid ' + (refreshing ? 'fa-circle-notch fa-spin' : 'fa-rotate')} style={{ marginInlineEnd: 6 }}></i>
                    {ar ? 'تحديث الحالة' : 'Refresh status'}
                  </button>
                  <button type="button" onClick={() => setChanging(true)} style={{ ...secondaryBtnStyle, fontSize: 12.5 }}>
                    {ar ? 'تغيير الباقة' : 'Change plan'}
                  </button>
                </div>
              </div>
          ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, opacity: submitting ? 0.6 : 1, pointerEvents: submitting ? 'none' : 'auto' }}>
                  <PlanCard t={t} title={t.monthlyPlan} price={PLAN_PRICES.monthly} suffix={t.perMonth} onChoose={() => handleChoose('monthly')} />
                  <PlanCard t={t} title={t.quarterlyPlan} price={PLAN_PRICES.quarterly} suffix={t.perQuarter} onChoose={() => handleChoose('quarterly')} />
                  <PlanCard t={t} title={t.yearlyPlan} price={PLAN_PRICES.yearly} suffix={t.perYear} highlight badge={t.bestValue} onChoose={() => handleChoose('yearly')} />
                </div>
                {isRevoked && (
                  <div style={{ marginTop: 16, textAlign: 'center' }}>
                    <WhatsAppAction t={t} lang={lang} link={directWaLink} phone={ADMIN_WHATSAPP} label={t.sendViaWhatsapp} />
                  </div>
                )}
              </div>
          )}
        </div>
      </div>
    </div>
  )
}
