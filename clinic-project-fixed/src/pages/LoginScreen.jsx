import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth.jsx'
import LangSwitch from '../components/LangSwitch.jsx'
import Field from '../components/Field.jsx'
import { inputStyle, primaryBtnStyle, linkBtnStyle } from '../lib/sharedStyles'

export default function LoginScreen() {
  const { t, lang, setLang, specialties, handleLogin, handleAdminLogin, handleSignup, handleAgentSignup, handleAgentLogin, handleSecretaryLogin, busy } = useAuth()

  const [mode, setMode] = useState('login') // login | signup | admin | agent-login | agent-signup | secretary-login
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [companyPassword, setCompanyPassword] = useState('')
  const [specialtyId, setSpecialtyId] = useState(Object.keys(specialties)[0])
  const [error, setError] = useState('')
  const activeSpec = specialties[specialtyId]

  function switchMode(m) {
    setMode(m)
    setError('')
    setPassword('')
    setConfirmPassword('')
    setFullName('')
  }

  const [submitting, setSubmitting] = useState(false)

  async function submitAdmin(e) {
    if (e && e.preventDefault) e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError(t.loginError)
      return
    }
    setError('')
    setSubmitting(true)
    const result = await handleAdminLogin(email, password)
    setSubmitting(false)
    if (result && result.error) setError(result.error)
  }

  async function submitLogin(e) {
    if (e && e.preventDefault) e.preventDefault()
    if (!email.trim() || !password.trim() || !specialtyId) {
      setError(t.loginError)
      return
    }
    setError('')
    setSubmitting(true)
    const result = await handleLogin(email, password, specialtyId)
    setSubmitting(false)
    if (result && result.error) setError(result.error)
  }

  async function submitSignup(e) {
    if (e && e.preventDefault) e.preventDefault()
    if (!fullName.trim() || !email.trim() || !password.trim() || !phone.trim() || !specialtyId) {
      setError(t.loginError)
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t.invalidEmail)
      return
    }
    const cleanedPhone = phone.trim().replace(/[\s\-()]/g, '')
    if (!/^\+?[0-9]{7,15}$/.test(cleanedPhone)) {
      setError(t.invalidPhone)
      return
    }
    if (password.length < 6) {
      setError(t.passwordTooShort)
      return
    }
    if (password !== confirmPassword) {
      setError(t.passwordMismatch)
      return
    }
    setError('')
    setSubmitting(true)
    const result = await handleSignup(email, password, cleanedPhone, specialtyId, referralCode, fullName.trim())
    setSubmitting(false)
    if (result && result.error) setError(result.error)
  }

  async function submitAgentLogin(e) {
    if (e && e.preventDefault) e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError(t.loginError)
      return
    }
    setError('')
    setSubmitting(true)
    const result = await handleAgentLogin(email, password)
    setSubmitting(false)
    if (result && result.error) setError(result.error)
  }

  async function submitAgentSignup(e) {
    if (e && e.preventDefault) e.preventDefault()
    if (!fullName.trim() || !email.trim() || !password.trim() || !phone.trim() || !companyPassword.trim()) {
      setError(t.loginError)
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t.invalidEmail)
      return
    }
    const cleanedPhone = phone.trim().replace(/[\s\-()]/g, '')
    if (!/^\+?[0-9]{7,15}$/.test(cleanedPhone)) {
      setError(t.invalidPhone)
      return
    }
    if (password.length < 6) {
      setError(t.passwordTooShort)
      return
    }
    if (password !== confirmPassword) {
      setError(t.passwordMismatch)
      return
    }
    setError('')
    setSubmitting(true)
    const result = await handleAgentSignup(email, password, cleanedPhone, fullName.trim(), companyPassword.trim())
    setSubmitting(false)
    if (result && result.error) setError(result.error)
  }

  async function submitSecretaryLogin(e) {
    if (e && e.preventDefault) e.preventDefault()
    if (!fullName.trim() || !password.trim()) {
      setError(t.loginError)
      return
    }
    setError('')
    setSubmitting(true)
    const result = await handleSecretaryLogin(fullName.trim(), password)
    setSubmitting(false)
    if (result && result.error) setError(result.error)
  }

  const submit =
    mode === 'login'
      ? submitLogin
      : mode === 'signup'
        ? submitSignup
        : mode === 'agent-login'
          ? submitAgentLogin
          : mode === 'agent-signup'
            ? submitAgentSignup
            : mode === 'secretary-login'
              ? submitSecretaryLogin
              : submitAdmin

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-cream)', padding: 20 }}>
      <div style={{ position: 'fixed', top: 18, insetInlineEnd: 18 }}>
        <LangSwitch lang={lang} setLang={setLang} t={t} light />
      </div>
      <div
        className="fade-in"
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--card-white)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
          padding: '32px 32px 38px',
          border: '1px solid var(--border-soft)'
        }}
      >
        {mode === 'admin' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 22 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--green-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14
              }}
            >
              <i className="fa-solid fa-shield-halved" style={{ fontSize: 24, color: '#fff' }}></i>
            </div>
            <h1 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: 'var(--green-dark)' }}>{t.adminLoginTitle}</h1>
          </div>
        ) : mode === 'agent-login' || mode === 'agent-signup' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 22 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14
              }}
            >
              <i className="fa-solid fa-people-group" style={{ fontSize: 24, color: '#fff' }}></i>
            </div>
            <h1 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: 'var(--green-dark)' }}>{t.agentPortalTitle}</h1>
          </div>
        ) : mode === 'secretary-login' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 22 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--green-mid)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14
              }}
            >
              <i className="fa-solid fa-user-tie" style={{ fontSize: 24, color: '#fff' }}></i>
            </div>
            <h1 style={{ fontSize: 19, fontWeight: 700, margin: 0, color: 'var(--green-dark)' }}>{t.secretaryLoginTitle}</h1>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 22 }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'var(--green-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 14,
                transition: 'all .25s ease'
              }}
            >
              <i className={'fa-solid ' + activeSpec.icon} style={{ fontSize: 26, color: 'var(--green-dark)' }}></i>
            </div>
            <h1 style={{ fontSize: 21, fontWeight: 700, margin: 0, color: 'var(--green-dark)' }}>{t.systemName}</h1>
            <p style={{ fontSize: 12.5, color: 'var(--text-sub)', marginTop: 6, textAlign: 'center', lineHeight: 1.6 }}>{t.demoNote}</p>
          </div>
        )}

        {(mode === 'login' || mode === 'signup') && (
          <div style={{ display: 'flex', background: 'var(--green-pale)', borderRadius: 12, padding: 4, marginBottom: 22 }}>
            <button
              type="button"
              onClick={() => switchMode('login')}
              style={{
                flex: 1,
                padding: '9px',
                border: 'none',
                borderRadius: 9,
                fontSize: 13.5,
                fontWeight: 700,
                background: mode === 'login' ? 'var(--card-white)' : 'transparent',
                color: mode === 'login' ? 'var(--green-dark)' : 'var(--text-sub)',
                boxShadow: mode === 'login' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              {t.loginTab}
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              style={{
                flex: 1,
                padding: '9px',
                border: 'none',
                borderRadius: 9,
                fontSize: 13.5,
                fontWeight: 700,
                background: mode === 'signup' ? 'var(--card-white)' : 'transparent',
                color: mode === 'signup' ? 'var(--green-dark)' : 'var(--text-sub)',
                boxShadow: mode === 'signup' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              {t.signupTab}
            </button>
          </div>
        )}
        {(mode === 'agent-login' || mode === 'agent-signup') && (
          <div style={{ display: 'flex', background: 'var(--green-pale)', borderRadius: 12, padding: 4, marginBottom: 22 }}>
            <button
              type="button"
              onClick={() => switchMode('agent-login')}
              style={{
                flex: 1,
                padding: '9px',
                border: 'none',
                borderRadius: 9,
                fontSize: 13.5,
                fontWeight: 700,
                background: mode === 'agent-login' ? 'var(--card-white)' : 'transparent',
                color: mode === 'agent-login' ? 'var(--green-dark)' : 'var(--text-sub)',
                boxShadow: mode === 'agent-login' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              {t.loginTab}
            </button>
            <button
              type="button"
              onClick={() => switchMode('agent-signup')}
              style={{
                flex: 1,
                padding: '9px',
                border: 'none',
                borderRadius: 9,
                fontSize: 13.5,
                fontWeight: 700,
                background: mode === 'agent-signup' ? 'var(--card-white)' : 'transparent',
                color: mode === 'agent-signup' ? 'var(--green-dark)' : 'var(--text-sub)',
                boxShadow: mode === 'agent-signup' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'
              }}
            >
              {t.signupTab}
            </button>
          </div>
        )}

        {(mode === 'signup' || mode === 'agent-signup') && (
          <Field label={mode === 'agent-signup' ? t.agentName : t.doctorFullName}>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit(e)
              }}
              placeholder={mode === 'agent-signup' ? t.agentName : t.doctorFullNamePlaceholder}
              style={inputStyle}
            />
          </Field>
        )}

        {mode === 'secretary-login' ? (
          <>
            <Field label={t.secretaryNameLabel}>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit(e)
                }}
                placeholder={t.secretaryNamePlaceholder}
                style={inputStyle}
                autoFocus
              />
            </Field>
            <Field label={t.password}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit(e)
                }}
                placeholder="••••••••"
                style={inputStyle}
              />
            </Field>
          </>
        ) : (
          <>
            <Field label={t.email}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit(e)
                }}
                placeholder={mode === 'admin' ? 'admin@example.com' : 'doctor@clinic.com'}
                style={inputStyle}
              />
            </Field>
            <Field label={t.password}>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submit(e)
                }}
                placeholder="••••••••"
                style={inputStyle}
              />
            </Field>
          </>
        )}
        {(mode === 'signup' || mode === 'agent-signup') && (
          <Field label={t.confirmPassword}>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit(e)
              }}
              placeholder="••••••••"
              style={inputStyle}
            />
          </Field>
        )}
        {(mode === 'signup' || mode === 'agent-signup') && (
          <Field label={t.phoneNumber}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit(e)
              }}
              placeholder="+963 9XX XXX XXX"
              style={inputStyle}
              dir="ltr"
            />
            <p style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 5 }}>{t.phoneHint}</p>
          </Field>
        )}
        {mode === 'signup' && (
          <Field label={t.referralCodeOptional}>
            <input
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit(e)
              }}
              placeholder={t.referralCodePlaceholder}
              style={inputStyle}
              dir="ltr"
            />
          </Field>
        )}
        {mode === 'agent-signup' && (
          <Field label={t.companyPassword}>
            <input
              type="password"
              value={companyPassword}
              onChange={(e) => setCompanyPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submit(e)
              }}
              placeholder="••••••••"
              style={inputStyle}
            />
          </Field>
        )}
        {mode !== 'admin' && mode !== 'agent-login' && mode !== 'agent-signup' && mode !== 'secretary-login' && (
          <Field label={t.chooseSpecialty}>
            <select value={specialtyId} onChange={(e) => setSpecialtyId(e.target.value)} style={inputStyle}>
              {Object.values(specialties).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name[lang]}
                </option>
              ))}
            </select>
          </Field>
        )}

        {error && <p style={{ color: 'var(--red)', fontSize: 13, margin: '6px 0 0' }}>{error}</p>}

        <button type="button" onClick={submit} disabled={submitting || busy} style={{ ...primaryBtnStyle, width: '100%', marginTop: 18, padding: '13px', opacity: submitting ? 0.6 : 1 }}>
          {submitting
            ? '...'
            : mode === 'login'
              ? t.login
              : mode === 'signup'
                ? t.createAccount
                : mode === 'agent-login'
                  ? t.login
                  : mode === 'agent-signup'
                    ? t.createAccount
                    : mode === 'secretary-login'
                      ? t.login
                      : t.adminLoginBtn}
        </button>

        {mode === 'signup' && <p style={{ fontSize: 11.5, color: 'var(--text-sub)', textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>{t.trialHint}</p>}

        <div style={{ textAlign: 'center', marginTop: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {mode === 'admin' || mode === 'agent-login' || mode === 'agent-signup' || mode === 'secretary-login' ? (
            <button type="button" onClick={() => switchMode('login')} style={{ ...linkBtnStyle, fontSize: 12.5 }}>
              <i className={'fa-solid ' + (lang === 'ar' ? 'fa-arrow-right' : 'fa-arrow-left')} style={{ marginInlineEnd: 6 }}></i>
              {t.backToDoctorLogin}
            </button>
          ) : (
            <>
              <button type="button" onClick={() => switchMode('secretary-login')} style={{ ...linkBtnStyle, fontSize: 12.5, color: 'var(--green-mid)' }}>
                <i className="fa-solid fa-user-tie" style={{ marginInlineEnd: 6 }}></i>
                {t.secretaryLoginLink}
              </button>
              <button type="button" onClick={() => switchMode('agent-signup')} style={{ ...linkBtnStyle, fontSize: 12.5, color: 'var(--amber)' }}>
                <i className="fa-solid fa-people-group" style={{ marginInlineEnd: 6 }}></i>
                {t.agentPortalLink}
              </button>
              <button type="button" onClick={() => switchMode('admin')} style={{ ...linkBtnStyle, fontSize: 12, color: 'var(--text-sub)' }}>
                {t.adminLoginLink}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
