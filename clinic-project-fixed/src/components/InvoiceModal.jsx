import React, { useRef, useState, useEffect } from 'react'
import ModalShell from './ModalShell.jsx'
import ModalTitle from './ModalTitle.jsx'
import MetricMini from './MetricMini.jsx'
import { secondaryBtnStyle, primaryBtnStyle } from '../lib/sharedStyles'
import { calcTotals, fmtMoney, formatMoneyLines, todayStr } from '../lib/utils'
import { useAuth } from '../hooks/useAuth.jsx'

export default function InvoiceModal({ t, lang, specialty, patient, onClose }) {
  const { activeClinicLogo, activeShamcashQr, getNextInvoiceNumber } = useAuth()
  const { costByCurrency, paidByCurrency, remainingByCurrency, hasRemaining } = calcTotals(patient)
  const printRef = useRef(null)
  const [invoiceNumber, setInvoiceNumber] = useState(null)
  const fetchedOnce = useRef(false)

  // نجيب رقم فاتورة جديد مرة وحدة بس لما تُفتح الشاشة (مش بكل إعادة رندر)
  useEffect(() => {
    if (fetchedOnce.current) return
    fetchedOnce.current = true
    getNextInvoiceNumber().then((num) => {
      if (num !== null) setInvoiceNumber(num)
    })
  }, [getNextInvoiceNumber])

  function handlePrint() {
    const w = window.open('', '_blank')
    if (!w) {
      // WebView الأندرويد/مانع النوافذ ما بيسمح بنافذة جديدة: نطبع الصفحة الحالية بدل ما يصير خطأ
      try {
        window.print()
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('print unavailable', e)
      }
      return
    }
    // نبني الصفحة بعناصر DOM آمنة بدل حقن نص خام — أي بيانات المريض (مثل الاسم) بتنحط كنص عادي (textContent)
    // ما بينفّذ أبداً كـ HTML، وهيك ما في احتمال حقن كود خبيث حتى لو الاسم يحتوي وسوم HTML.
    w.document.title = t.invoiceFor + ' - ' + patient.name
    const style = w.document.createElement('style')
    style.textContent = `body{font-family:'Tajawal',sans-serif;padding:30px;color:#2A2A26;} table{width:100%;border-collapse:collapse;margin-top:10px;} td,th{padding:8px;border-bottom:1px solid #eee;text-align:${lang === 'ar' ? 'right' : 'left'};} h2{color:#1F4B3F;}`
    w.document.head.appendChild(style)
    w.document.documentElement.setAttribute('dir', t.dir)
    const importedContent = w.document.importNode(printRef.current, true)
    w.document.body.appendChild(importedContent)
    w.document.close()
    w.print()
  }

  return (
    <ModalShell onClose={onClose} wide>
      <ModalTitle icon="fa-file-invoice-dollar" text={t.printInvoice} onClose={onClose} />
      <div ref={printRef} style={{ border: '1px solid var(--border-soft)', borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {activeClinicLogo && (
              <img src={activeClinicLogo} alt="logo" style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 8 }} />
            )}
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>{t.clinicSystem}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green-dark)' }}>{specialty.name[lang]}</div>
            </div>
          </div>
          <div style={{ textAlign: lang === 'ar' ? 'left' : 'right' }}>
            <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>
              {t.invoiceNumber} {invoiceNumber !== null ? <strong>#{invoiceNumber}</strong> : t.loadingApp}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>{t.generatedOn}</div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{todayStr()}</div>
          </div>
        </div>
        <h2 style={{ fontSize: 16, marginBottom: 4 }}>
          {t.invoiceFor}: {patient.name}
        </h2>
        <div style={{ fontSize: 12.5, color: 'var(--text-sub)', marginBottom: 14 }}>
          {patient.phone} · {patient.age} {t.years}
        </div>

        <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-soft)' }}>
              <th style={{ textAlign: lang === 'ar' ? 'right' : 'left', padding: '6px 0' }}>{t.treatmentType}</th>
              <th style={{ textAlign: lang === 'ar' ? 'right' : 'left', padding: '6px 0' }}>{t.date}</th>
              <th style={{ textAlign: lang === 'ar' ? 'left' : 'right', padding: '6px 0' }}>{t.price}</th>
            </tr>
          </thead>
          <tbody>
            {patient.sessions.map((s) => (
              <tr key={s.id} style={{ borderBottom: '1px solid #f0ede0' }}>
                <td style={{ padding: '6px 0' }}>{s.type}</td>
                <td style={{ padding: '6px 0' }}>{s.date}</td>
                <td style={{ padding: '6px 0', textAlign: lang === 'ar' ? 'left' : 'right', direction: 'ltr' }}>{fmtMoney(s.price, s.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginTop: 18 }}>
          <MetricMini label={t.totalCost} value={formatMoneyLines(costByCurrency)} color="var(--text-main)" />
          <MetricMini label={t.totalPaid} value={formatMoneyLines(paidByCurrency)} color="var(--green-mid)" />
          <MetricMini label={t.balanceDue} value={formatMoneyLines(remainingByCurrency, { onlyPositive: true })} color={hasRemaining ? 'var(--amber)' : 'var(--green-mid)'} />
        </div>
        {activeShamcashQr && (
          <div style={{ marginTop: 16, textAlign: 'center', borderTop: '1px dashed var(--border-soft)', paddingTop: 14 }}>
            <div style={{ fontSize: 12.5, color: 'var(--text-sub)', marginBottom: 8 }}>{t.payViaShamcash}</div>
            <img src={activeShamcashQr} alt="Sham Cash QR" style={{ width: 150, height: 150, objectFit: 'contain' }} />
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button onClick={onClose} style={{ ...secondaryBtnStyle, flex: 1 }}>
          {t.close}
        </button>
        <button
          onClick={handlePrint}
          disabled={invoiceNumber === null}
          style={{ ...primaryBtnStyle, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, opacity: invoiceNumber === null ? 0.6 : 1 }}
        >
          <i className="fa-solid fa-print"></i>
          <span>{t.print}</span>
        </button>
      </div>
    </ModalShell>
  )
}
