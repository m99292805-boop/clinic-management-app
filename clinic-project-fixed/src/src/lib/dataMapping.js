import { supabase } from './supabaseClient'
import { DEFAULT_SPECIALTIES } from './config'

export function dbSpecialtyToLocal(row) {
  return {
    id: row.id,
    icon: row.icon,
    name: { ar: row.name_ar, en: row.name_en },
    treatments: { ar: row.treatments_ar, en: row.treatments_en },
    extraField: { ar: row.extra_field_ar, en: row.extra_field_en }
  }
}

export function dbSessionToLocal(row) {
  return {
    id: row.id,
    type: row.type,
    date: row.date,
    price: row.price,
    currency: row.currency || 'USD',
    notes: row.notes || '',
    extra: row.extra_value || '',
    beforeImg: row.before_img || null,
    afterImg: row.after_img || null
  }
}

export function dbPaymentToLocal(row) {
  return {
    id: row.id,
    amount: row.amount,
    date: row.date,
    method: row.method,
    currency: row.currency || 'USD',
    // دفعة بعملة مختلفة عن عملة الدين: المبلغ المحتسب من الدين وعملته (اختياري)
    settleCurrency: row.settle_currency || null,
    settleAmount: row.settle_amount !== null && row.settle_amount !== undefined ? Number(row.settle_amount) : null
  }
}

export function dbPatientToLocal(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone || '',
    age: row.age || '',
    nextAppointment: row.next_appointment || '',
    notes: row.health_notes || '',
    createdAt: row.created_at,
    sessions: (row.sessions || []).map(dbSessionToLocal).sort((a, b) => new Date(b.date) - new Date(a.date)),
    payments: (row.payments || []).map(dbPaymentToLocal).sort((a, b) => new Date(b.date) - new Date(a.date))
  }
}

export async function fetchSpecialties() {
  const { data, error } = await supabase.from('specialties').select('*')
  if (error || !data || data.length === 0) return DEFAULT_SPECIALTIES
  const out = {}
  data.forEach((row) => {
    out[row.id] = dbSpecialtyToLocal(row)
  })
  return out
}

// نفس fetchSpecialties لكن بترجّع null عند الفشل (حتى ما نكتب الاختصاصات الافتراضية فوق الكاش الصحيح)
export async function fetchSpecialtiesStrict() {
  const { data, error } = await supabase.from('specialties').select('*')
  if (error || !data || data.length === 0) return null
  const out = {}
  data.forEach((row) => {
    out[row.id] = dbSpecialtyToLocal(row)
  })
  return out
}

export async function fetchMyPatients(doctorId) {
  // مهم للأداء: ما نجيب صور الجلسات (before_img/after_img) هون — هاي أكبر سبب للبطء
  // وقت فتح التطبيق لأنها base64 كبيرة الحجم. منجيبها لاحقًا بس لما الطبيب يفتح مريض معيّن.
  const { data, error } = await supabase
    .from('patients')
    .select('*, sessions(id, type, date, price, currency, notes, extra_value), payments(*)')
    .eq('doctor_id', doctorId)
    .order('created_at', { ascending: false })
  // null = فشل الجلب (شبكة/صلاحية). ما نرجّع [] حتى ما يظن المستخدم إنه ما عنده مرضى.
  if (error || !data) return null
  return data.map(dbPatientToLocal)
}

export async function fetchSessionImages(patientId) {
  const { data, error } = await supabase.from('sessions').select('id, before_img, after_img').eq('patient_id', patientId)
  if (error) return { error: true }
  const map = {}
  ;(data || []).forEach((row) => {
    map[row.id] = { beforeImg: row.before_img || null, afterImg: row.after_img || null }
  })
  return map
}

export async function fetchMySubscription(doctorId) {
  const { data, error } = await supabase.from('subscriptions').select('*').eq('doctor_id', doctorId).maybeSingle()
  if (error) {
    // eslint-disable-next-line no-console
    console.error('fetchMySubscription error:', error.message)
    return { error: true }
  }
  if (!data) return null
  return {
    status: data.status,
    plan: data.plan,
    startDate: data.start_date,
    endDate: data.end_date,
    pendingPlan: data.pending_plan,
    pendingNote: data.payment_note || '',
    pendingRequestedAt: data.pending_requested_at || null
  }
}
