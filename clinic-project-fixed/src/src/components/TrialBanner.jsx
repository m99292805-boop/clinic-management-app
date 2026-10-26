import React, { useState } from 'react'
import TrialRenewalModal from './TrialRenewalModal.jsx'
import { ADMIN_WHATSAPP } from '../lib/config'
import { daysLeft } from '../lib/utils'

export default function TrialBanner({ t, lang, sub, session, specialty, onRequestRenewal }) {
  const [showPicker, setShowPicker] = useState(false)
  const remaining = daysLeft(sub)
  const isPending = sub && sub.pendingPlan

  return (
    <div style={{ background: 'var(--amber-bg)', borderBottom: '1px solid var(--border-soft)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '9px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--amber)', fontWeight: 600 }}>
          <i className="fa-solid fa-triangle-exclamation"></i>
          <span>
            {t.trialEndingSoon} {sub.endDate} ({remaining} {t.days})
          </span>
        </div>
        {isPending ? (
          <span style={{ fontSize: 12, color: 'var(--amber)', fontWeight: 600 }}>
            <i className="fa-solid fa-clock" style={{ marginInlineEnd: 6 }}></i>
            {t.pendingApproval}
          </span>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href={`https://wa.me/${ADMIN_WHATSAPP.replace('+', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: '#25D366',
                color: '#fff',
                padding: '7px 14px',
                borderRadius: 'var(--radius-btn)',
                fontSize: 12.5,
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              <i className="fa-brands fa-whatsapp"></i>
            </a>
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              style={{ background: 'var(--amber)', color: '#fff', border: 'none', borderRadius: 'var(--radius-btn)', padding: '7px 16px', fontSize: 12.5, fontWeight: 700 }}
            >
              {t.renewNow}
            </button>
          </div>
        )}
      </div>

      {showPicker && (
        <TrialRenewalModal
          t={t}
          lang={lang}
          session={session}
          specialty={specialty}
          onClose={() => setShowPicker(false)}
          onChoose={(plan) => onRequestRenewal(plan)}
        />
      )}
    </div>
  )
}
