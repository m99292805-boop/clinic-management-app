import React from 'react'
import { daysLeft } from '../lib/utils'

// نسخة Google Play: تنبيه انتهاء التجربة فقط، بدون أزرار دفع أو تجديد أو روابط
export default function TrialBannerPlay({ t, sub }) {
  const remaining = daysLeft(sub)
  return (
    <div style={{ background: 'var(--amber-bg)', borderBottom: '1px solid var(--border-soft)' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--amber)', fontWeight: 600 }}>
        <i className="fa-solid fa-triangle-exclamation"></i>
        <span>
          {t.trialEndingSoon} {sub.endDate} ({remaining} {t.days})
        </span>
      </div>
    </div>
  )
}
