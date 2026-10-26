import React from 'react'
import Field from '../components/Field.jsx'
import SectionCard from '../components/SectionCard.jsx'
import EmptyRow from '../components/EmptyRow.jsx'
import MetricMini from '../components/MetricMini.jsx'
import { cardStyle, inputStyle, secondaryBtnStyle, dangerBtnStyle, rowStyle, linkBtnStyle } from '../lib/sharedStyles'
import { calcTotals, currencySymbol, fmtMoney, formatMoneyLines } from '../lib/utils'

export default function PatientDetail({ t, lang, specialty, patient, onBack, onDelete, onPrint, onAddSession, onAddPayment, onUpdateField, onUpdateFieldDebounced }) {
  const { costByCurrency, paidByCurrency, remainingByCurrency, hasRemaining } = calcTotals(patient)
  return (
    <div className="fade-in">
      <button onClick={onBack} style={{ ...linkBtnStyle, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
        <i className={'fa-solid ' + (lang === 'ar' ? 'fa-arrow-right' : 'fa-arrow-left')}></i>
        <span>{t.backToPatients}</span>
      </button>

      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'var(--green-pale)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 19,
                fontWeight: 700,
                color: 'var(--green-dark)'
              }}
            >
              {patient.name.trim()[0]}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{patient.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>{patient.phone}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onPrint} style={{ ...secondaryBtnStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="fa-solid fa-file-invoice"></i>
              <span>{t.printInvoice}</span>
            </button>
            <button onClick={onDelete} style={{ ...dangerBtnStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="fa-solid fa-trash"></i>
              <span>{t.deletePatient}</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <Field label={t.age}>
            <input type="number" value={patient.age} onChange={(e) => onUpdateFieldDebounced('age', e.target.value)} style={inputStyle} />
          </Field>
          <Field label={t.nextAppointment}>
            <input type="date" value={patient.nextAppointment} onChange={(e) => onUpdateField('nextAppointment', e.target.value)} style={inputStyle} />
          </Field>
        </div>
        <Field label={t.healthNotes}>
          <textarea value={patient.notes} onChange={(e) => onUpdateFieldDebounced('notes', e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical', height: 'auto' }} />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 16 }}>
          <MetricMini label={t.paid} value={formatMoneyLines(paidByCurrency)} color="var(--green-mid)" />
          <MetricMini label={t.totalCost} value={formatMoneyLines(costByCurrency)} color="var(--text-main)" />
          <MetricMini label={t.remaining} value={formatMoneyLines(remainingByCurrency, { onlyPositive: true })} color={hasRemaining ? 'var(--amber)' : 'var(--green-mid)'} />
        </div>
      </div>

      <SectionCard title={t.sessions} icon="fa-notes-medical" actionLabel={t.addSession} onAction={onAddSession}>
        {patient.sessions.length === 0 ? (
          <EmptyRow text={t.noSessions} />
        ) : (
          patient.sessions.map((s) => (
            <div key={s.id} style={{ ...rowStyle, flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.type}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>
                    {s.date}
                    {s.extra ? ' · ' + specialty.extraField[lang] + ': ' + s.extra : ''}
                  </div>
                  {s.notes && <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 2 }}>{s.notes}</div>}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green-dark)', direction: 'ltr' }}>{fmtMoney(s.price, s.currency)}</div>
              </div>
              {(s.beforeImg || s.afterImg) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {s.beforeImg && (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-sub)', marginBottom: 4 }}>{t.beforeImage}</div>
                      <img
                        src={s.beforeImg}
                        alt={t.beforeImage}
                        loading="lazy"
                        style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border-soft)' }}
                      />
                    </div>
                  )}
                  {s.afterImg && (
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-sub)', marginBottom: 4 }}>{t.afterImage}</div>
                      <img
                        src={s.afterImg}
                        alt={t.afterImage}
                        loading="lazy"
                        style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border-soft)' }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </SectionCard>

      <SectionCard title={t.payments} icon="fa-sack-dollar" actionLabel={t.addPayment} onAction={onAddPayment}>
        {patient.payments.length === 0 ? (
          <EmptyRow text={t.noPayments} />
        ) : (
          patient.payments.map((p) => (
            <div key={p.id} style={rowStyle}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.date}</div>
                <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>{p.method === 'cash' ? t.cash : t.transfer}</div>
              </div>
              <div style={{ textAlign: 'end' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green-mid)' }} dir="ltr">
                  {p.amount} {currencySymbol(p.currency)}
                </div>
                {p.settleCurrency && (
                  <div style={{ fontSize: 11.5, color: 'var(--text-sub)' }} dir="ltr">
                    ≈ {fmtMoney(p.settleAmount, p.settleCurrency)} {t.settledToDebt}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </SectionCard>
    </div>
  )
}
