import React, { useState } from 'react'
import ModalShell from './ModalShell.jsx'
import ModalTitle from './ModalTitle.jsx'
import ModalActions from './ModalActions.jsx'
import Field from './Field.jsx'
import { inputStyle } from '../lib/sharedStyles'
import { todayStr, currencyLabel, currencySymbol, fmtMoney } from '../lib/utils'
import { CURRENCIES } from '../lib/config'

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100

// debts: { USD: 90, SYP: 0, ... } المتبقي لكل عملة (لعرض خيار "تسديد دين بعملة أخرى" فقط عند وجود دين بعملة مختلفة)
export default function AddPaymentModal({ t, lang, onClose, onSave, debts = {} }) {
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [date, setDate] = useState(todayStr())
  const [method, setMethod] = useState('cash')
  const [settleTo, setSettleTo] = useState('') // عملة الدين التي تُحتسب منها الدفعة ('' = نفس عملة الدفعة)
  const [rate, setRate] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const debtOptions = Object.keys(debts).filter((c) => c !== currency && Number(debts[c]) > 0)
  const effectiveSettle = debtOptions.includes(settleTo) ? settleTo : ''
  const amountNum = Number(amount)
  const rateNum = Number(rate)
  const equivalent = effectiveSettle && Number.isFinite(amountNum) && amountNum > 0 && Number.isFinite(rateNum) && rateNum > 0 ? round2(amountNum / rateNum) : null

  async function submit() {
    if (submitting) return
    if (amount === '' || !date) {
      setError(t.fillRequired)
      return
    }
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setError(t.invalidAmount)
      return
    }
    const payload = { amount: amountNum, currency, date, method }
    if (effectiveSettle) {
      if (!Number.isFinite(rateNum) || rateNum <= 0 || !equivalent || equivalent <= 0) {
        setError(t.invalidRate)
        return
      }
      payload.settleCurrency = effectiveSettle
      payload.settleAmount = equivalent
    }
    setError('')
    setSubmitting(true)
    await onSave(payload)
    setSubmitting(false)
  }

  return (
    <ModalShell onClose={onClose}>
      <ModalTitle icon="fa-sack-dollar" text={t.addPayment} onClose={onClose} />
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 10 }}>
        <Field label={t.amount}>
          <input type="number" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} style={inputStyle} />
        </Field>
        <Field label={t.currency}>
          <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={inputStyle}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {currencyLabel(c.code, lang)}
              </option>
            ))}
          </select>
        </Field>
      </div>

      {debtOptions.length > 0 && (
        <div style={{ background: 'var(--bg-cream)', borderRadius: 12, padding: '10px 12px', marginBottom: 12 }}>
          <Field label={t.settleLabel}>
            <select value={effectiveSettle} onChange={(e) => setSettleTo(e.target.value)} style={inputStyle}>
              <option value="">{t.settleNone}</option>
              {debtOptions.map((c) => (
                <option key={c} value={c}>
                  {currencyLabel(c, lang)} — {t.remaining}: {fmtMoney(debts[c], c)}
                </option>
              ))}
            </select>
          </Field>
          {effectiveSettle && (
            <div>
              <div style={{ fontSize: 12.5, color: 'var(--text-sub)', marginBottom: 6 }}>{t.rateLabel}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, direction: 'ltr' }}>
                <span style={{ fontWeight: 700 }}>1 {currencySymbol(effectiveSettle)} =</span>
                <input type="number" inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} style={{ ...inputStyle, flex: 1, minWidth: 0 }} />
                <span style={{ fontWeight: 700 }}>{currencySymbol(currency)}</span>
              </div>
              {equivalent !== null && (
                <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: 'var(--green-dark)' }} dir="ltr">
                  ≈ {fmtMoney(equivalent, effectiveSettle)} → {t.settleResult}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <Field label={t.date}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
      </Field>
      <Field label={t.paymentMethod}>
        <select value={method} onChange={(e) => setMethod(e.target.value)} style={inputStyle}>
          <option value="cash">{t.cash}</option>
          <option value="transfer">{t.transfer}</option>
        </select>
      </Field>
      {error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}
      <ModalActions t={t} onClose={onClose} onSave={submit} saveLabel={t.savePayment} disabled={submitting} />
    </ModalShell>
  )
}
