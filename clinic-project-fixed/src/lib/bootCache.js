// كاش خفيف لتسريع فتح التطبيق: بنخزّن (بدون أي بيانات مرضى) بروفايل الطبيب/السكرتيرة/الموظف + الاشتراك + الاختصاصات،
// فنفتح الواجهة فوراً من الجهاز، وبعدها نحدّث من الإنترنت بالخلفية. بيانات المرضى ما بتتخزن بالكاش أبداً.
const BOOT_KEY = 'clinic_boot_v1'
const SPEC_KEY = 'clinic_specialties_v1'
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000

// المستخدم المحفوظ جلسته على الجهاز (قراءة محلية فورية، بدون أي طلب شبكة).
// ملاحظة: supabase.auth.getSession() ممكن يرجّع null لو الشبكة ضعيفة وقت تجديد التوكن، رغم إنه الجلسة سليمة.
export function readStoredAuthUser() {
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k && /^sb-.+-auth-token$/.test(k)) {
        const s = JSON.parse(localStorage.getItem(k) || 'null')
        if (s && s.user && s.user.id) return { id: s.user.id }
      }
    }
  } catch (e) {
    // localStorage غير متاح: نتجاهل
  }
  return null
}

export function readBootCache(userId) {
  try {
    const raw = localStorage.getItem(BOOT_KEY)
    if (!raw) return null
    const d = JSON.parse(raw)
    if (!d || d.v !== 1 || d.userId !== userId || !d.kind) return null
    if (Date.now() - Number(d.savedAt || 0) > MAX_AGE_MS) return null
    return d
  } catch (e) {
    return null
  }
}

export function writeBootCache(data) {
  try {
    localStorage.setItem(BOOT_KEY, JSON.stringify({ v: 1, savedAt: Date.now(), ...data }))
  } catch (e) {
    // الذاكرة ممتلئة أو غير متاحة: التطبيق يشتغل بدون كاش
  }
}

export function clearBootCache() {
  try {
    localStorage.removeItem(BOOT_KEY)
  } catch (e) {
    // تجاهل
  }
}

export function readCachedSpecialties() {
  try {
    const raw = localStorage.getItem(SPEC_KEY)
    if (!raw) return null
    const d = JSON.parse(raw)
    return d && d.v === 1 && d.data && Object.keys(d.data).length > 0 ? d.data : null
  } catch (e) {
    return null
  }
}

export function writeCachedSpecialties(data) {
  try {
    localStorage.setItem(SPEC_KEY, JSON.stringify({ v: 1, data }))
  } catch (e) {
    // تجاهل
  }
}
