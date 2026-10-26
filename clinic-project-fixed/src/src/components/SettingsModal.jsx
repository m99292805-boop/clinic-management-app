import DeleteAccountSection from './DeleteAccountSection.jsx'
import React, { useState, useRef } from 'react'
import ModalShell from './ModalShell.jsx'
import ModalTitle from './ModalTitle.jsx'
import Field from './Field.jsx'
import { secondaryBtnStyle, primaryBtnStyle, dangerBtnStyle, inputStyle } from '../lib/sharedStyles'
import { useCopyToClipboard } from '../hooks/useCopyToClipboard'
import { useAuth } from '../hooks/useAuth.jsx'
import { compressImageFile } from '../lib/imageCompress'

export default function SettingsModal({ t, lang, specialties, referralCode, onClose }) {
  const { profile, mySecretaryName, createSecretary, deleteSecretary, updateClinicLogo, updateShamcashQr, changePassword, deleteMyAccount } = useAuth()
  const { copiedValue, copyFailed, copy } = useCopyToClipboard()
  const copied = copiedValue === referralCode

  return (
    <ModalShell onClose={onClose} wide>
      <ModalTitle icon="fa-gear" text={t.settings} onClose={onClose} />
      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--green-dark)', marginBottom: 10 }}>{t.currentSpecialties}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 }}>
        {Object.values(specialties).map((s) => (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--green-pale)', borderRadius: 20, padding: '6px 12px', fontSize: 12.5 }}>
            <i className={'fa-solid ' + s.icon} style={{ color: 'var(--green-dark)' }}></i>
            <span>{s.name[lang]}</span>
          </div>
        ))}
      </div>

      <SecretarySection t={t} secretaryName={mySecretaryName} onCreate={createSecretary} onDelete={deleteSecretary} />

      <ClinicImageSection
        t={t}
        icon="fa-image"
        title={t.clinicLogoTitle}
        hint={t.clinicLogoHint}
        uploadLabel={t.uploadLogo}
        changeLabel={t.changeLogo}
        removeLabel={t.removeLogo}
        placeholderIcon="fa-hospital"
        currentImage={profile ? profile.clinic_logo : null}
        onSave={updateClinicLogo}
        maxDim={200}
        quality={0.85}
        previewSize={56}
      />

      <ClinicImageSection
        t={t}
        icon="fa-qrcode"
        title={t.shamcashQrTitle}
        hint={t.shamcashQrHint}
        uploadLabel={t.uploadQr}
        changeLabel={t.changeQr}
        removeLabel={t.removeQr}
        placeholderIcon="fa-qrcode"
        currentImage={profile ? profile.shamcash_qr : null}
        onSave={updateShamcashQr}
        maxDim={700}
        quality={0.92}
        previewSize={96}
      />

      <ChangePasswordSection t={t} onChange={changePassword} />

      <DeleteAccountSection t={t} onDelete={deleteMyAccount} />

      {referralCode && (
        <div style={{ background: 'var(--bg-cream)', borderRadius: 12, padding: '16px 18px', marginTop: 22 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--green-dark)', marginBottom: 6 }}>{t.myReferralCode}</div>
          <p style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 12, lineHeight: 1.7 }}>{t.referralHint}</p>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div
              style={{
                flex: 1,
                background: '#fff',
                border: '1.5px dashed var(--green-mid)',
                borderRadius: 8,
                padding: '10px 14px',
                fontWeight: 800,
                fontSize: 18,
                letterSpacing: 2,
                textAlign: 'center',
                direction: 'ltr'
              }}
            >
              {referralCode}
            </div>
            <button type="button" onClick={() => copy(referralCode)} style={{ ...secondaryBtnStyle, padding: '10px 16px' }}>
              <i className={'fa-solid ' + (copyFailed ? 'fa-triangle-exclamation' : copied ? 'fa-check' : 'fa-copy')}></i>
            </button>
          </div>
          {copyFailed && <p style={{ fontSize: 11.5, color: 'var(--red)', marginTop: 6 }}>{t.clipboardError}</p>}
        </div>
      )}
    </ModalShell>
  )
}

function SecretarySection({ t, secretaryName, onCreate, onDelete }) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  async function handleCreate() {
    if (!name.trim() || !password) {
      setError(t.fillRequired)
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
    setBusy(true)
    const ok = await onCreate(name.trim(), password)
    setBusy(false)
    if (ok) {
      setShowForm(false)
      setName('')
      setPassword('')
      setConfirmPassword('')
    }
  }

  async function handleDelete() {
    setBusy(true)
    await onDelete()
    setBusy(false)
    setConfirmingDelete(false)
  }

  return (
    <div style={{ background: 'var(--bg-cream)', borderRadius: 12, padding: '16px 18px', marginTop: 22 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--green-dark)', marginBottom: 6 }}>
        <i className="fa-solid fa-user-tie" style={{ marginInlineEnd: 6 }}></i>
        {t.secretarySectionTitle}
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 14, lineHeight: 1.7 }}>{t.secretarySectionHint}</p>

      {secretaryName ? (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff', borderRadius: 10, padding: '10px 14px' }}>
          <div style={{ fontSize: 13.5, fontWeight: 600 }}>
            <i className="fa-solid fa-circle-check" style={{ color: 'var(--green-mid)', marginInlineEnd: 6 }}></i>
            {secretaryName}
          </div>
          {confirmingDelete ? (
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" onClick={() => setConfirmingDelete(false)} disabled={busy} style={{ ...secondaryBtnStyle, padding: '6px 10px', fontSize: 12 }}>
                {t.cancel}
              </button>
              <button type="button" onClick={handleDelete} disabled={busy} style={{ ...dangerBtnStyle, padding: '6px 10px', fontSize: 12 }}>
                {busy ? '...' : t.confirm}
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmingDelete(true)} style={{ ...dangerBtnStyle, padding: '6px 12px', fontSize: 12 }}>
              <i className="fa-solid fa-trash" style={{ marginInlineEnd: 6 }}></i>
              {t.removeSecretary}
            </button>
          )}
        </div>
      ) : showForm ? (
        <div>
          <Field label={t.secretaryNameLabel}>
            <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} placeholder={t.secretaryNamePlaceholder} />
          </Field>
          <Field label={t.password}>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
          </Field>
          <Field label={t.confirmPassword}>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle} />
          </Field>
          {error && <p style={{ color: 'var(--red)', fontSize: 12.5, marginBottom: 10 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setShowForm(false)} disabled={busy} style={{ ...secondaryBtnStyle, flex: 1 }}>
              {t.cancel}
            </button>
            <button type="button" onClick={handleCreate} disabled={busy} style={{ ...primaryBtnStyle, flex: 1 }}>
              {busy ? '...' : t.saveSecretary}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setShowForm(true)} style={{ ...primaryBtnStyle, display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fa-solid fa-user-plus"></i>
          <span>{t.addSecretary}</span>
        </button>
      )}
    </div>
  )
}

function ClinicImageSection({ t, icon, title, hint, uploadLabel, changeLabel, removeLabel, placeholderIcon, currentImage, onSave, maxDim, quality, previewSize }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState(currentImage || null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleFile(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    try {
      const dataUrl = await compressImageFile(file, { maxDim, quality })
      setError('')
      setBusy(true)
      const ok = await onSave(dataUrl)
      setBusy(false)
      if (ok) setPreview(dataUrl)
    } catch (err) {
      setError(err.message === 'too-large' ? t.imageTooLarge : t.invalidImageType)
      e.target.value = ''
    }
  }

  async function handleRemove() {
    setBusy(true)
    const ok = await onSave(null)
    setBusy(false)
    if (ok) setPreview(null)
  }

  return (
    <div style={{ background: 'var(--bg-cream)', borderRadius: 12, padding: '16px 18px', marginTop: 22 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--green-dark)', marginBottom: 6 }}>
        <i className={'fa-solid ' + icon} style={{ marginInlineEnd: 6 }}></i>
        {title}
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 14, lineHeight: 1.7 }}>{hint}</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: previewSize,
            height: previewSize,
            borderRadius: 10,
            background: '#fff',
            border: '1px solid var(--border-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            flexShrink: 0
          }}
        >
          {preview ? (
            <img src={preview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <i className={'fa-solid ' + placeholderIcon} style={{ color: 'var(--text-sub)', fontSize: 18 }}></i>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" disabled={busy} onClick={() => inputRef.current?.click()} style={{ ...secondaryBtnStyle, fontSize: 12.5, padding: '8px 14px' }}>
            {busy ? '...' : preview ? changeLabel : uploadLabel}
          </button>
          {preview && (
            <button type="button" disabled={busy} onClick={handleRemove} style={{ ...dangerBtnStyle, fontSize: 12.5, padding: '8px 14px' }}>
              {removeLabel}
            </button>
          )}
        </div>
        <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      </div>
      {error && <p style={{ color: 'var(--red)', fontSize: 11.5, marginTop: 8 }}>{error}</p>}
    </div>
  )
}

function ChangePasswordSection({ t, onChange }) {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [busy, setBusy] = useState(false)

  function reset() {
    setCurrent('')
    setNext('')
    setConfirm('')
    setError('')
  }

  async function submit() {
    if (busy) return
    setSuccess(false)
    if (!current || !next || !confirm) return setError(t.fillRequired)
    if (next.length < 6) return setError(t.passwordTooShort)
    if (next !== confirm) return setError(t.passwordMismatch)
    setError('')
    setBusy(true)
    const res = await onChange(current, next)
    setBusy(false)
    if (res && res.ok) {
      reset()
      setOpen(false)
      setSuccess(true)
    } else {
      setError((res && res.error) || t.passwordChangeError)
    }
  }

  return (
    <div style={{ background: 'var(--bg-cream)', borderRadius: 12, padding: '16px 18px', marginTop: 22 }}>
      <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--green-dark)', marginBottom: 10 }}>
        <i className="fa-solid fa-key" style={{ marginInlineEnd: 6 }}></i>
        {t.changePasswordTitle}
      </div>
      {success && <p style={{ color: 'var(--green-mid)', fontSize: 12.5, marginBottom: 10 }}>{t.passwordChangedOk}</p>}
      {open ? (
        <div>
          <Field label={t.currentPassword}>
            <input type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} style={inputStyle} />
          </Field>
          <Field label={t.newPassword}>
            <input type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} style={inputStyle} />
          </Field>
          <Field label={t.confirmNewPassword}>
            <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} style={inputStyle} />
          </Field>
          {error && <p style={{ color: 'var(--red)', fontSize: 12.5, marginBottom: 10 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                reset()
                setOpen(false)
              }}
              style={{ ...secondaryBtnStyle, flex: 1 }}
            >
              {t.cancel}
            </button>
            <button type="button" disabled={busy} onClick={submit} style={{ ...primaryBtnStyle, flex: 1 }}>
              {busy ? '...' : t.updatePasswordBtn}
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => {
            setSuccess(false)
            setOpen(true)
          }}
          style={{ ...primaryBtnStyle, display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <i className="fa-solid fa-lock"></i>
          <span>{t.updatePasswordBtn}</span>
        </button>
      )}
    </div>
  )
}
