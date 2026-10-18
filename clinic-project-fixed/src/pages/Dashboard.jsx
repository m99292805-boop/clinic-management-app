import React, { useState, useEffect } from 'react'
import { cardStyle, inputStyle, primaryBtnStyle, secondaryBtnStyle } from '../lib/sharedStyles'
import { isWithinDays, calcTotals, buildPatientReminderLink, formatMoneyLines } from '../lib/utils'
import { exportPatientsToCsv } from '../lib/exportCsv'

const PAGE_SIZE = 20

export default function Dashboard({ t, lang, specialty, patients, patientsLoading, patientsLoadFailed, onReloadPatients, searchTerm, setSearchTerm, onAddPatient, onSelectPatient }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [exporting, setExporting] = useState(false)
  const [exportFailed, setExportFailed] = useState(false)

  // كل بيانات المرضى محمّلة أصلاً بالذاكرة (بدون صور — تلك تتحمّل لاحقاً عند فتح مريض معيّن).
  // هون منعرض بس أول PAGE_SIZE بالواجهة، وهاد التصفح المرحلي يخفف الرندر إذا صار عدد المرضى كبير.
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [searchTerm])

  const upcoming = patients.filter((p) => isWithinDays(p.nextAppointment, 7)).sort((a, b) => new Date(a.nextAppointment) - new Date(b.nextAppointment))

  const filtered = patients.filter((p) => {
    const s = searchTerm.trim().toLowerCase()
    if (!s) return true
    return p.name.toLowerCase().includes(s) || p.phone.includes(s)
  })

  const visiblePatients = filtered.slice(0, visibleCount)
  const hasMore = filtered.length > visibleCount

  return (
    <div className="fade-in">
      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={{ fontSize: 12.5, color: 'var(--text-sub)', marginBottom: 6 }}>{t.upcomingAppointments}</div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--green-dark)' }}>{upcoming.length}</div>
        </div>
        {upcoming.length === 0 ? (
          <div style={{ fontSize: 12.5, color: 'var(--text-sub)' }}>{t.noAppointments}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 70, overflowY: 'auto' }} className="scrollbar-thin">
            {upcoming.slice(0, 4).map((p) => (
              <div key={p.id} onClick={() => onSelectPatient(p.id)} style={{ fontSize: 12.5, color: 'var(--text-main)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between' }}>
                <span>{p.name}</span>
                <span style={{ color: 'var(--text-sub)' }}>{p.nextAppointment}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={onAddPatient} style={{ ...primaryBtnStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fa-solid fa-plus"></i>
          <span>{t.addPatient}</span>
        </button>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <i
            className="fa-solid fa-magnifying-glass"
            style={{ position: 'absolute', insetInlineStart: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-sub)', fontSize: 13 }}
          ></i>
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder={t.searchPlaceholder} style={{ ...inputStyle, paddingInlineStart: 36 }} />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--green-dark)' }}>{t.patientsList}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {patients.length > 0 && (
            <button
              type="button"
              disabled={exporting}
              onClick={async () => {
                setExporting(true)
                setExportFailed(false)
                const ok = await exportPatientsToCsv(filtered, lang)
                setExporting(false)
                if (!ok) {
                  setExportFailed(true)
                  setTimeout(() => setExportFailed(false), 4000)
                }
              }}
              style={{ background: 'transparent', border: 'none', color: exportFailed ? 'var(--red)' : 'var(--green-mid)', fontSize: 12.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 0', opacity: exporting ? 0.6 : 1 }}
            >
              <i className={'fa-solid ' + (exporting ? 'fa-circle-notch fa-spin' : 'fa-file-excel')}></i>
              {exportFailed ? t.saveError : t.exportPatients}
            </button>
          )}
          {filtered.length > 0 && (
            <div style={{ fontSize: 11.5, color: 'var(--text-sub)' }}>
              {visiblePatients.length}/{filtered.length}
            </div>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', color: 'var(--text-sub)', padding: '40px 20px' }}>
          <i className="fa-solid fa-user-injured" style={{ fontSize: 26, marginBottom: 10, display: 'block' }}></i>
          {patients.length === 0 && patientsLoading ? (
            <span>
              <i className="fa-solid fa-circle-notch fa-spin" style={{ marginInlineEnd: 8 }}></i>
              {t.loadingPatients}
            </span>
          ) : patients.length === 0 && patientsLoadFailed ? (
            <span>
              {t.patientsLoadFailed}
              <br />
              <button onClick={onReloadPatients} style={{ marginTop: 12, background: 'var(--green-dark)', color: '#fff', border: 'none', borderRadius: 12, padding: '8px 18px', fontSize: 13.5 }}>
                {t.reloadPatients}
              </button>
            </span>
          ) : patients.length === 0 ? (
            t.noPatients
          ) : (
            t.searchNoResults
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {visiblePatients.map((p) => {
            const { remainingByCurrency, hasRemaining } = calcTotals(p)
            const reminderDue = isWithinDays(p.nextAppointment, 1)
            return (
              <div
                key={p.id}
                style={{
                  ...cardStyle,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px'
                }}
              >
                <div onClick={() => onSelectPatient(p.id)} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', flex: 1 }}>
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: '50%',
                      background: 'var(--green-pale)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                      fontWeight: 700,
                      color: 'var(--green-dark)'
                    }}
                  >
                    {p.name.trim()[0]}
                  </div>
                  <div>
                    <div style={{ fontSize: 14.5, fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>
                      {p.phone} · {p.age} {t.years}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {reminderDue && (
                    <a
                      href={buildPatientReminderLink(p, specialty.name[lang], lang)}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      title={t.sendReminder}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: '#25D366',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none',
                        flexShrink: 0
                      }}
                    >
                      <i className="fa-brands fa-whatsapp" style={{ fontSize: 16 }}></i>
                    </a>
                  )}
                  <div onClick={() => onSelectPatient(p.id)} style={{ textAlign: lang === 'ar' ? 'left' : 'right', cursor: 'pointer' }}>
                    <div style={{ fontSize: 11.5, color: 'var(--text-sub)' }}>{t.nextAppointment}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, marginBottom: 6 }}>{p.nextAppointment || '—'}</div>
                    <span
                      style={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        padding: '3px 10px',
                        borderRadius: 20,
                        background: hasRemaining ? 'var(--amber-bg)' : 'var(--green-light)',
                        color: hasRemaining ? 'var(--amber)' : 'var(--green-mid)'
                      }}
                    >
                      {formatMoneyLines(remainingByCurrency, { onlyPositive: true, joiner: ' + ' })}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
          {hasMore && (
            <button type="button" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)} style={{ ...secondaryBtnStyle, alignSelf: 'center', marginTop: 4 }}>
              {t.loadMorePatients}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
