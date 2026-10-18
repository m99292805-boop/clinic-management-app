import { createClient } from '@supabase/supabase-js'

// القيم تأتي من .env؛ وإن غاب الملف وقت البناء نستخدم القيم الافتراضية أدناه
// (المفتاح publishable مخصص للعميل بطبيعته، والحماية الفعلية عبر سياسات RLS في Supabase)
const FALLBACK_URL = 'https://qdthcaucbfabscwyjuqz.supabase.co'
const FALLBACK_KEY = 'sb_publishable_an-5nPu05ddG7AM54aF0oA_hwYNBGyl'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  // eslint-disable-next-line no-console
  console.warn('تنبيه: ملف .env غير موجود وقت البناء، تم استخدام الإعدادات الافتراضية')
}

// مهلة لكل طلب شبكة (25 ثانية): بدونها ممكن الطلب يعلق دقائق على شبكة ضعيفة وتبقى الشاشة معلّقة.
const REQUEST_TIMEOUT_MS = 25000
function fetchWithTimeout(input, init = {}) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS)
  if (init.signal) {
    if (init.signal.aborted) ctrl.abort()
    else init.signal.addEventListener('abort', () => ctrl.abort(), { once: true })
  }
  return fetch(input, { ...init, signal: ctrl.signal }).finally(() => clearTimeout(timer))
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { fetch: fetchWithTimeout },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})
