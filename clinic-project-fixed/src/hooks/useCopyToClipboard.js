import { useState, useRef, useEffect } from 'react'
import { safeCopyToClipboard } from '../lib/utils'

/**
 * يوحّد منطق "انسخ للحافظة وأظهر نجاح/فشل لفترة قصيرة" المستخدم بعدة مكونات.
 * copiedValue: آخر قيمة انُسخت بنجاح (أو null) — مفيد لما يكون في أكتر من عنصر قابل للنسخ بنفس القائمة.
 * copyFailed: صار خطأ بآخر محاولة نسخ.
 * copy(value): ينفّذ النسخ الفعلي.
 */
export function useCopyToClipboard(resetDelayMs = 1800) {
  const [copiedValue, setCopiedValue] = useState(null)
  const [copyFailed, setCopyFailed] = useState(false)
  const timerRef = useRef(null)

  // تنظيف المؤقت المعلّق لو المكوّن انقفل قبل ما ينتهي (يمنع أي state update بعد unmount)
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  function copy(value) {
    if (timerRef.current) clearTimeout(timerRef.current)
    safeCopyToClipboard(value)
      .then(() => {
        setCopyFailed(false)
        setCopiedValue(value)
        timerRef.current = setTimeout(() => setCopiedValue(null), resetDelayMs)
      })
      .catch(() => {
        setCopiedValue(null)
        setCopyFailed(true)
        timerRef.current = setTimeout(() => setCopyFailed(false), resetDelayMs)
      })
  }

  return { copiedValue, copyFailed, copy }
}
