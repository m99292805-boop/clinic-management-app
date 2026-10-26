import { CURRENCIES, ADMIN_WHATSAPP, PLAN_PRICES } from './config'

export function currencyLabel(code, lang) {
  const c = CURRENCIES.find((c) => c.code === code)
  if (!c) return code
  return lang === 'ar' ? `${c.ar} (${c.symbol})` : `${c.en} (${c.symbol})`
}

export function currencySymbol(code) {
  const c = CURRENCIES.find((c) => c.code === code)
  return c ? c.symbol : code
}

export function addDaysToDate(dateStr, days) {
  // نحلل السترنغ يدويًا ونبني التاريخ بالتوقيت المحلي (مش UTC) لتفادي مشاكل تغيّر اليوم
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  dt.setDate(dt.getDate() + days)
  const yy = dt.getFullYear()
  const mm = String(dt.getMonth() + 1).padStart(2, '0')
  const dd = String(dt.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

export function todayStr() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function isExpired(sub) {
  if (!sub) return true
  if (sub.status !== 'active') return true
  return new Date(todayStr()) > new Date(sub.endDate)
}

export function daysLeft(sub) {
  if (!sub || !sub.endDate) return 0
  const diff = (new Date(sub.endDate) - new Date(todayStr())) / (1000 * 60 * 60 * 24)
  return Math.ceil(diff)
}

export function buildWhatsappLink(doctorEmail, plan, specialtyLabel, lang) {
  const price = PLAN_PRICES[plan]
  const planLabelText =
    plan === 'monthly'
      ? lang === 'ar'
        ? 'شهري'
        : 'Monthly'
      : plan === 'quarterly'
        ? lang === 'ar'
          ? '3 أشهر'
          : 'Quarterly'
        : lang === 'ar'
          ? 'سنوي'
          : 'Yearly'
  const msg =
    lang === 'ar'
      ? `مرحبًا، أريد تجديد/تفعيل اشتراكي في نظام إدارة العيادات.\nالبريد الإلكتروني: ${doctorEmail}\nالتخصص: ${specialtyLabel}\nالخطة: ${planLabelText} ($${price})\nمرفق إشعار الدفع.`
      : `Hello, I'd like to activate/renew my clinic system subscription.\nEmail: ${doctorEmail}\nSpecialty: ${specialtyLabel}\nPlan: ${planLabelText} ($${price})\nPayment proof attached.`
  return `https://wa.me/${ADMIN_WHATSAPP.replace('+', '')}?text=${encodeURIComponent(msg)}`
}

// يجهّز الرقم لصيغة wa.me (أرقام دولية فقط بدون + أو 00 أو صفر محلي).
// الرقم المحلي اللي يبدأ بصفر واحد (مثل 0937...) منعتبره سوري (963) لأن التطبيق موجّه للسوق السوري.
export function normalizeWaPhone(phone) {
  let digits = String(phone || '').replace(/[^\d+]/g, '')
  const hadPlus = digits.startsWith('+')
  digits = digits.replace(/\+/g, '')
  if (hadPlus) return digits
  if (digits.startsWith('00')) return digits.slice(2)
  if (digits.startsWith('0')) return '963' + digits.slice(1)
  return digits
}

export function buildPatientReminderLink(patient, specialtyLabel, lang) {
  const cleanPhone = normalizeWaPhone(patient.phone)
  const msg =
    lang === 'ar'
      ? `مرحبًا ${patient.name}،\nنود تذكيركم بموعدكم في ${specialtyLabel} بتاريخ ${patient.nextAppointment}.\nيرجى التواصل في حال الرغبة بتأجيل الموعد. شكرًا لكم.`
      : `Hello ${patient.name},\nThis is a reminder of your appointment at ${specialtyLabel} on ${patient.nextAppointment}.\nPlease contact us if you'd like to reschedule. Thank you.`
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
}

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100

// المبلغ الذي يُحتسب من الدين: إن كانت الدفعة مسدَّدة بعملة مختلفة (settle) نعتمد المبلغ المقابل وعملته،
// وإلا نعتمد المبلغ الفعلي بعملته. (دخل الشهر يبقى بالمبلغ الفعلي المستلم)
export function paymentCredit(x) {
  if (x && x.settleCurrency && Number(x.settleAmount) > 0) return { cur: x.settleCurrency, amt: Number(x.settleAmount) }
  return { cur: (x && x.currency) || 'USD', amt: Number((x && x.amount) || 0) }
}

// ترتيب العملات: الدولار أولاً ثم الباقي أبجدياً
function sortedCurrencies(codes) {
  return [...codes].sort((a, b) => (a === 'USD' ? -1 : b === 'USD' ? 1 : a.localeCompare(b)))
}

// الحساب لكل عملة على حدة (ما في خلط بين العملات أبداً):
// تكلفة الجلسات بعملتها، الدفعات بعملتها، والمتبقي = تكلفة - مدفوع بنفس العملة.
export function calcTotals(patient) {
  const costByCurrency = {}
  patient.sessions.forEach((x) => {
    const cur = x.currency || 'USD'
    costByCurrency[cur] = round2((costByCurrency[cur] || 0) + Number(x.price || 0))
  })
  const paidByCurrency = {}
  patient.payments.forEach((x) => {
    const c = paymentCredit(x)
    paidByCurrency[c.cur] = round2((paidByCurrency[c.cur] || 0) + c.amt)
  })
  const currencies = sortedCurrencies(new Set([...Object.keys(costByCurrency), ...Object.keys(paidByCurrency)]))
  const remainingByCurrency = {}
  currencies.forEach((c) => {
    remainingByCurrency[c] = round2(Math.max(0, (costByCurrency[c] || 0) - (paidByCurrency[c] || 0)))
  })
  return {
    costByCurrency,
    paidByCurrency,
    remainingByCurrency,
    currencies,
    hasRemaining: currencies.some((c) => remainingByCurrency[c] > 0)
  }
}

export function fmtMoney(amount, cur) {
  const n = Number(amount || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })
  const sym = currencySymbol(cur || 'USD')
  return cur === 'USD' || !cur ? `$${n}` : `${n} ${sym}`
}

// يحوّل {USD: 10, SYP: 5000} لنص: "$10" سطر و"5,000 ل.س" سطر. onlyPositive: يتجاهل الأصفار (للمتبقي)
export function formatMoneyLines(map, { onlyPositive = false, joiner = '\n' } = {}) {
  const codes = sortedCurrencies(Object.keys(map || {})).filter((c) => !onlyPositive || Number(map[c]) > 0)
  if (codes.length === 0) return fmtMoney(0, 'USD')
  return codes.map((c) => fmtMoney(map[c], c)).join(joiner)
}

// تحويل 'YYYY-MM-DD' لتاريخ محلي (مش UTC) لتفادي انزياح اليوم بالمناطق الزمنية السالبة
function parseLocalDate(dateStr) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(dateStr || ''))
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return new Date(dateStr)
}

export function isWithinDays(dateStr, days) {
  if (!dateStr) return false
  const target = parseLocalDate(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diff = (target - today) / (1000 * 60 * 60 * 24)
  return diff >= 0 && diff <= days
}

export function monthIncome(patients, monthOffset = 0) {
  const target = new Date()
  target.setDate(1) // نثبّت اليوم أولًا لتفادي مشاكل تجاوز عدد أيام الشهر عند setMonth
  target.setMonth(target.getMonth() + monthOffset)
  const targetMonth = target.getMonth()
  const targetYear = target.getFullYear()
  const byCurrency = {}
  patients.forEach((p) => {
    p.payments.forEach((pay) => {
      const d = parseLocalDate(pay.date)
      if (d.getMonth() === targetMonth && d.getFullYear() === targetYear) {
        const cur = pay.currency || 'USD'
        byCurrency[cur] = (byCurrency[cur] || 0) + Number(pay.amount || 0)
      }
    })
  })
  return byCurrency
}

// نسخ آمن للحافظة مع بديل احتياطي للمتصفحات القديمة/سياقات بدون صلاحية Clipboard API
export function safeCopyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text).catch(() => legacyCopyFallback(text))
  }
  return legacyCopyFallback(text)
}

function legacyCopyFallback(text) {
  try {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.focus()
    ta.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(ta)
    return ok ? Promise.resolve() : Promise.reject(new Error('copy failed'))
  } catch (e) {
    return Promise.reject(e)
  }
}

export function planLabel(t, plan) {
  if (plan === 'yearly') return t.yearlyPlan
  if (plan === 'quarterly') return t.quarterlyPlan
  if (plan === 'trial') return t.trial
  return t.monthlyPlan
}

// عدد المرضى الجدد اللي انضافوا الشهر الحالي (حسب تاريخ إنشاء ملف المريض)
export function newPatientsThisMonth(patients) {
  const now = new Date()
  return patients.filter((p) => {
    if (!p.createdAt) return false
    const d = new Date(p.createdAt)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
}

// نسبة التحصيل: مجموع المدفوع بالدولار ÷ مجموع تكلفة كل الجلسات، كنسبة مئوية.
// (نفس تبسيط calcTotals: العملات غير الدولار ما تدخل بهاد الحساب لأنه تكلفة الجلسات نفسها بالدولار دائماً)
export function collectionRate(patients) {
  // لكل عملة: نسبة التحصيل = مدفوع/تكلفة (بحد أقصى 100%). النسبة الكلية = متوسط موزون بعدد الجلسات لكل عملة.
  const cost = {}
  const paid = {}
  const sessionsCount = {}
  patients.forEach((p) => {
    p.sessions.forEach((x) => {
      const c = x.currency || 'USD'
      cost[c] = (cost[c] || 0) + Number(x.price || 0)
      sessionsCount[c] = (sessionsCount[c] || 0) + 1
    })
    p.payments.forEach((x) => {
      const cr = paymentCredit(x)
      paid[cr.cur] = (paid[cr.cur] || 0) + cr.amt
    })
  })
  let weighted = 0
  let weights = 0
  Object.keys(cost).forEach((c) => {
    if (cost[c] > 0) {
      weighted += Math.min(1, (paid[c] || 0) / cost[c]) * sessionsCount[c]
      weights += sessionsCount[c]
    }
  })
  if (weights === 0) return null
  return Math.round((weighted / weights) * 100)
}
