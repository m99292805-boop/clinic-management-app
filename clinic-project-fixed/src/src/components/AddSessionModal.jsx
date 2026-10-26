import React, { useState } from 'react'
import ModalShell from './ModalShell.jsx'
import ModalTitle from './ModalTitle.jsx'
import ModalActions from './ModalActions.jsx'
import Field from './Field.jsx'
import ImageUploadField from './ImageUploadField.jsx'
import { inputStyle } from '../lib/sharedStyles'
import { todayStr, currencyLabel } from '../lib/utils'
import { CURRENCIES } from '../lib/config'
import { compressImageFile } from '../lib/imageCompress'

export default function AddSessionModal({ t, lang, specialty, onClose, onSave }) {
  const treatments = specialty.treatments[lang]
  const lastTreatment = treatments[treatments.length - 1] // آخر عنصر بالقائمة دائماً هو "أخرى/Other"
  const [type, setType] = useState(treatments[0])
  const [customType, setCustomType] = useState('')
  const [price, setPrice] = useState('')
  const [currency, setCurrency] = useState('USD')
  const [date, setDate] = useState(todayStr())
  const [extra, setExtra] = useState('')
  const [notes, setNotes] = useState('')
  const [beforeImg, setBeforeImg] = useState(null)
  const [afterImg, setAfterImg] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const isOther = type === lastTreatment

  async function handleImage(e, setter) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    try {
      const dataUrl = await compressImageFile(file)
      setError('')
      setter(dataUrl)
    } catch (err) {
      setError(err.message === 'too-large' ? t.imageTooLarge : t.invalidImageType)
      e.target.value = ''
    }
  }

  async function submit() {
    if (submitting) return
    if (!price || (isOther && !customType.trim())) {
      setError(t.fillRequired)
      return
    }
    const priceNum = Number(price)
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError(t.invalidPrice)
      return
    }
    if (!CURRENCIES.some((c) => c.code === currency)) {
      setError(t.fillRequired)
      return
    }
    const finalType = isOther ? customType.trim() : type
    setSubmitting(true)
    await onSave({ type: finalType, price: priceNum, currency, date, extra, notes, beforeImg, afterImg })
    setSubmitting(false)
  }

  return (
    <ModalShell onClose={onClose}>
      <ModalTitle icon="fa-notes-medical" text={t.addSession} onClose={onClose} />
      <Field label={t.treatmentType}>
        <select value={type} onChange={(e) => setType(e.target.value)} style={inputStyle}>
          {treatments.map((tr) => (
            <option key={tr} value={tr}>
              {tr}
            </option>
          ))}
        </select>
      </Field>
      {isOther && (
        <Field label={t.customTreatmentLabel}>
          <input
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            style={{ ...inputStyle, border: '1.5px solid var(--green-mid)', background: 'var(--green-pale)' }}
            placeholder={t.customTreatmentPlaceholder}
            autoFocus
          />
        </Field>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label={t.price}>
          <input type="number" inputMode="decimal" min="0" value={price} onChange={(e) => setPrice(e.target.value)} style={inputStyle} />
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
      <Field label={t.date}>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
      </Field>
      <Field label={specialty.extraField[lang]}>
        <input value={extra} onChange={(e) => setExtra(e.target.value)} style={inputStyle} />
      </Field>
      <Field label={t.notes}>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical', height: 'auto' }} />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
        <ImageUploadField label={t.beforeImage} value={beforeImg} onChange={(e) => handleImage(e, setBeforeImg)} onRemove={() => setBeforeImg(null)} />
        <ImageUploadField label={t.afterImage} value={afterImg} onChange={(e) => handleImage(e, setAfterImg)} onRemove={() => setAfterImg(null)} />
      </div>

      {error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}
      <ModalActions t={t} onClose={onClose} onSave={submit} saveLabel={t.save} disabled={submitting} />
    </ModalShell>
  )
}
