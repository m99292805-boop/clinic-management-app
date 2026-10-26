import React, { useState } from 'react'
import ModalShell from './ModalShell.jsx'
import ModalTitle from './ModalTitle.jsx'
import ModalActions from './ModalActions.jsx'
import Field from './Field.jsx'
import { inputStyle } from '../lib/sharedStyles'

export default function AddPatientModal({ t, onClose, onSave }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [age, setAge] = useState('')
  const [nextAppointment, setNextAppointment] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function submit() {
    if (submitting) return
    if (!name.trim() || !phone.trim()) {
      setError(t.fillRequired)
      return
    }
    const ageNum = age === '' ? 0 : Number(age)
    if (age !== '' && (!Number.isFinite(ageNum) || ageNum < 0 || ageNum > 130)) {
      setError(t.invalidAge)
      return
    }
    setError('')
    setSubmitting(true)
    await onSave({ name, phone, age: ageNum, nextAppointment })
    setSubmitting(false)
  }

  return (
    <ModalShell onClose={onClose}>
      <ModalTitle icon="fa-user-plus" text={t.addPatient} onClose={onClose} />
      <Field label={t.name}>
        <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
      </Field>
      <Field label={t.phone}>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} style={inputStyle} />
      </Field>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label={t.age}>
          <input type="number" min="0" max="130" value={age} onChange={(e) => setAge(e.target.value)} style={inputStyle} />
        </Field>
        <Field label={t.nextAppointment}>
          <input type="date" value={nextAppointment} onChange={(e) => setNextAppointment(e.target.value)} style={inputStyle} />
        </Field>
      </div>
      {error && <p style={{ color: 'var(--red)', fontSize: 13 }}>{error}</p>}
      <ModalActions t={t} onClose={onClose} onSave={submit} disabled={submitting} />
    </ModalShell>
  )
}
