import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { readStoredAuthUser, readBootCache, writeBootCache, clearBootCache, readCachedSpecialties, writeCachedSpecialties } from '../lib/bootCache'
import { STR } from '../lib/i18n'
import { DEFAULT_SPECIALTIES, ADMIN_EMAIL } from '../lib/config'
import { fetchSpecialtiesStrict, fetchMyPatients, fetchMySubscription, fetchSessionImages, dbSessionToLocal, dbPaymentToLocal, dbPatientToLocal } from '../lib/dataMapping'
import { isExpired, addDaysToDate, todayStr } from '../lib/utils'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [lang, setLang] = useState('ar')
  const t = STR[lang]

  const [loaded, setLoaded] = useState(false)
  const [bootError, setBootError] = useState(false) // الجلسة سليمة لكن الشبكة فشلت وقت الإقلاع (نعرض إعادة محاولة بدل شاشة الدخول)
  const [patientsLoading, setPatientsLoading] = useState(false)
  const [patientsLoadFailed, setPatientsLoadFailed] = useState(false)
  const bootRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [toast, setToast] = useState(null)

  const [profile, setProfile] = useState(null)
  const [agentData, setAgentData] = useState(null)
  const [agentRewards, setAgentRewards] = useState([])

  const [secretaryContext, setSecretaryContext] = useState(null) // بيانات السكرتيرة نفسها (لما تسجل دخول)
  const [mySecretaryName, setMySecretaryName] = useState(null) // اسم سكرتيرة الطبيب الحالي (لعرضه بالإعدادات)

  const [specialties, setSpecialties] = useState(DEFAULT_SPECIALTIES)
  const [patients, setPatients] = useState([])
  const [mySub, setMySub] = useState(null)

  const [adminProfiles, setAdminProfiles] = useState([])
  const [adminSubs, setAdminSubs] = useState({})
  const [adminCounts, setAdminCounts] = useState({})
  const [adminOverview, setAdminOverview] = useState({}) // doctor_id -> أرقام مجمّعة (مرضى/جلسات/مبالغ) بدون أي بيانات شخصية
  const [adminAgents, setAdminAgents] = useState([])
  const [adminAgentRewards, setAdminAgentRewards] = useState([])
  const [adminSecretaries, setAdminSecretaries] = useState({}) // doctor_id -> secretary name

  const debounceTimers = useRef({})
  const patientsRef = useRef([])
  const loadedImagesFor = useRef(new Set())

  // معرف الطبيب الفعلي يلي عم نشتغل على بياناته الآن — سواء كان المستخدم الحالي هو الطبيب نفسه أو سكرتيرته
  useEffect(() => {
    patientsRef.current = patients
  }, [patients])

  const activeDoctorId = profile ? profile.id : secretaryContext ? secretaryContext.doctorProfileId : null
  const activeSpecialtyId = profile ? profile.specialty_id : secretaryContext ? secretaryContext.specialtyId : null
  const activeClinicLogo = profile ? profile.clinic_logo : secretaryContext ? secretaryContext.clinicLogo : null
  const activeShamcashQr = profile ? profile.shamcash_qr : secretaryContext ? secretaryContext.shamcashQr : null

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2200)
  }, [])

  useEffect(() => {
    document.documentElement.dir = t.dir
    document.documentElement.lang = lang
    document.body.className = lang === 'en' ? 'lang-en' : ''
  }, [lang, t.dir])

  const loadAdminData = useCallback(async () => {
    const [{ data: profs }, { data: subs }, { data: overview }, { data: ags }, { data: agRewards }, { data: secs }] = await Promise.all([
      supabase.from('profiles').select('id, email, phone, full_name, specialty_id, referred_by, referral_code, agent_id, created_at').eq('is_admin', false),
      supabase.from('subscriptions').select('doctor_id, status, plan, start_date, end_date, pending_plan, pending_requested_at, payment_note'),
      supabase.rpc('admin_doctors_overview'),
      supabase.from('agents').select('id, name, phone, code, created_at').order('created_at', { ascending: false }),
      supabase.from('agent_rewards').select('agent_id, doctor_id, amount, created_at'),
      supabase.from('secretaries').select('doctor_id, name')
    ])
    const countByDoctor = {}
    const overviewByDoctor = {}
    ;(Array.isArray(overview) ? overview : []).forEach((o) => {
      countByDoctor[o.doctor_id] = Number(o.patients || 0)
      overviewByDoctor[o.doctor_id] = {
        patients: Number(o.patients || 0),
        sessions: Number(o.sessions || 0),
        billed: o.billed || {},
        collected: o.collected || {},
        lastActivity: o.last_activity || null
      }
    })
    const subByDoctor = {}
    ;(subs || []).forEach((s) => {
      subByDoctor[s.doctor_id] = {
        status: s.status,
        plan: s.plan,
        startDate: s.start_date,
        endDate: s.end_date,
        pendingPlan: s.pending_plan,
        pendingRequestedAt: s.pending_requested_at,
        paymentNote: s.payment_note || ''
      }
    })
    const secByDoctor = {}
    ;(secs || []).forEach((s) => {
      secByDoctor[s.doctor_id] = s.name
    })
    setAdminProfiles(profs || [])
    setAdminSubs(subByDoctor)
    setAdminCounts(countByDoctor)
    setAdminOverview(overviewByDoctor)
    setAdminAgents(ags || [])
    setAdminAgentRewards(agRewards || [])
    setAdminSecretaries(secByDoctor)
  }, [])

  const loadProfileAndData = useCallback(
    async (userId, target) => {
      let prof = null
      if (target.isAdmin) {
        const { data, error: qerr } = await supabase.from('profiles').select('*').eq('user_id', userId).eq('is_admin', true).maybeSingle()
        if (qerr && !data) return { error: t.loadFailed, network: true }
        prof = data
        if (!prof) {
          const {
            data: { user }
          } = await supabase.auth.getUser()
          if (user && user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
            const ins = await supabase.from('profiles').insert({ user_id: userId, email: user.email.toLowerCase(), is_admin: true, lang }).select().single()
            prof = ins.data
          }
        }
      } else {
        const { data, error: qerr } = await supabase.from('profiles').select('*').eq('user_id', userId).eq('specialty_id', target.specialtyId).maybeSingle()
        if (qerr && !data) return { error: t.loadFailed, network: true }
        prof = data && !data.is_admin ? data : null
      }
      if (!prof) {
        return { error: target.isAdmin ? t.adminWrongCredentials : t.noAccountForSpecialty }
      }
      setProfile(prof)
      if (prof.is_admin) {
        await loadAdminData()
      } else {
        const [pats, sub, { data: sec }] = await Promise.all([
          fetchMyPatients(prof.id),
          fetchMySubscription(prof.id),
          supabase.from('secretaries').select('name').eq('doctor_id', prof.id).maybeSingle()
        ])
        setPatients(Array.isArray(pats) ? pats : [])
        setPatientsLoadFailed(!Array.isArray(pats))
        setMySub(sub)
        setMySecretaryName(sec ? sec.name : null)
      }
      return { error: null }
    },
    [lang, t, loadAdminData]
  )

  const loadAgentDashboard = useCallback(async (strict = false) => {
    const { data, error } = await supabase.rpc('get_my_agent_dashboard')
    if (error && strict) return 'error'
    if (error || !data || data.length === 0) {
      setAgentData(null)
      setAgentRewards([])
      return false
    }
    setAgentData({ name: data[0].agent_name, code: data[0].agent_code })
    setAgentRewards(
      data.filter((r) => r.doctor_name && r.earned_at).map((r) => ({ name: r.doctor_name, email: r.doctor_email, at: r.earned_at, amount: r.amount }))
    )
    return true
  }, [])

  // يحمّل بيانات جلسة السكرتيرة (بعد ما تسجل دخول فعلياً)، ويجيب بيانات الطبيب المرتبطة فيها
  const loadSecretaryContext = useCallback(async (strict = false) => {
    const { data, error } = await supabase.rpc('get_my_secretary_context')
    if (error && strict) return 'error'
    if (error || !data || data.length === 0) {
      setSecretaryContext(null)
      return false
    }
    const ctx = data[0]
    setSecretaryContext({
      doctorProfileId: ctx.doctor_profile_id,
      doctorEmail: ctx.doctor_email,
      specialtyId: ctx.specialty_id,
      secretaryName: ctx.secretary_name,
      clinicLogo: ctx.clinic_logo,
      shamcashQr: ctx.shamcash_qr || null
    })
    const [pats, sub] = await Promise.all([fetchMyPatients(ctx.doctor_profile_id), fetchMySubscription(ctx.doctor_profile_id)])
    setPatients(Array.isArray(pats) ? pats : [])
    setPatientsLoadFailed(!Array.isArray(pats))
    setMySub(sub)
    return true
  }, [])

  useEffect(() => {
    let mounted = true

    // نفتح الواجهة فوراً من الكاش المحلي (بيانات الحساب والاشتراك فقط)
    const applyCache = (cache) => {
      if (cache.kind === 'doctor' && cache.profile) {
        setProfile(cache.profile)
        setMySub(cache.sub || null)
        setMySecretaryName(cache.secretaryName || null)
        return true
      }
      if (cache.kind === 'secretary' && cache.secretaryContext) {
        setSecretaryContext(cache.secretaryContext)
        setMySub(cache.sub || null)
        return true
      }
      if (cache.kind === 'agent' && cache.agentData) {
        setAgentData(cache.agentData)
        setAgentRewards(cache.agentRewards || [])
        return true
      }
      return false
    }

    // تحديث كل شي من الإنترنت بالخلفية بعد ما انفتحت الواجهة. أي فشل = ما بنطلّع المستخدم، بنعرض تنبيه بس.
    const refreshInBackground = async (cache) => {
      try {
        if (cache.kind === 'doctor') {
          const id = cache.profile.id
          const [pats, sub, secRes, profRes] = await Promise.all([
            fetchMyPatients(id),
            fetchMySubscription(id),
            supabase.from('secretaries').select('name').eq('doctor_id', id).maybeSingle(),
            supabase.from('profiles').select('*').eq('id', id).maybeSingle()
          ])
          if (!mounted) return
          if (profRes && profRes.data && !profRes.data.is_admin) setProfile(profRes.data)
          if (sub && !sub.error) setMySub(sub)
          if (secRes && !secRes.error) setMySecretaryName(secRes.data ? secRes.data.name : null)
          if (Array.isArray(pats)) {
            setPatients(pats)
            setPatientsLoadFailed(false)
          } else {
            setPatientsLoadFailed(true)
          }
        } else if (cache.kind === 'secretary') {
          const r = await loadSecretaryContext(true)
          if (mounted && r === 'error') setPatientsLoadFailed(true)
        } else if (cache.kind === 'agent') {
          await loadAgentDashboard(true)
        }
      } catch (err) {
        if (mounted) setPatientsLoadFailed(true)
      } finally {
        if (mounted) setPatientsLoading(false)
      }
    }

    // مسار بدون كاش (أول مرة على الجهاز): لازم الإنترنت. فشل الشبكة = شاشة "إعادة محاولة" وليس شاشة الدخول.
    const slowBoot = async (userId) => {
      const { data: myProfiles, error } = await supabase.from('profiles').select('id, specialty_id, is_admin').eq('user_id', userId)
      if (error) throw error
      const adminProf = (myProfiles || []).find((p) => p.is_admin)
      if (adminProf || (myProfiles && myProfiles.length)) {
        const res = await loadProfileAndData(userId, adminProf ? { isAdmin: true } : { specialtyId: myProfiles[0].specialty_id })
        if (res && res.network) throw new Error('network')
        return
      }
      const sec = await loadSecretaryContext(true)
      if (sec === 'error') throw new Error('secretary-context')
      if (sec !== true) {
        const ag = await loadAgentDashboard(true)
        if (ag === 'error') throw new Error('agent-dashboard')
      }
    }

    const boot = async () => {
      try {
        // الاختصاصات: من الكاش فوراً، وتحديث بالخلفية (بدون ما نعطّل الإقلاع)
        const cachedSp = readCachedSpecialties()
        if (cachedSp && mounted) setSpecialties(cachedSp)
        fetchSpecialtiesStrict()
          .then((sp) => {
            if (sp && mounted) {
              setSpecialties(sp)
              writeCachedSpecialties(sp)
            }
          })
          .catch(() => {})

        // الجلسة المحفوظة على الجهاز: قراءة محلية فورية (getSession ممكن يرجع null لو الشبكة ضعيفة وقت تجديد التوكن)
        let stored = readStoredAuthUser()
        if (!stored) {
          const r = await supabase.auth.getSession()
          const u = r && r.data && r.data.session ? r.data.session.user : null
          stored = u ? { id: u.id } : null
        }
        if (!stored) {
          if (mounted) setLoaded(true) // ما في جلسة: شاشة الدخول فوراً
          return
        }

        const cache = readBootCache(stored.id)
        if (cache && applyCache(cache)) {
          if (mounted) {
            setPatientsLoading(true)
            setLoaded(true)
          }
          refreshInBackground(cache)
          return
        }
        await slowBoot(stored.id)
        if (mounted) setLoaded(true)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Init failed:', err)
        if (mounted) {
          setBootError(true)
          setLoaded(true)
        }
      }
    }
    bootRef.current = boot
    boot()

    const {
      data: { subscription: authListener }
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        clearBootCache()
        setProfile(null)
        setAgentData(null)
        setAgentRewards([])
        setPatients([])
        setMySub(null)
        setAdminProfiles([])
        setAdminSubs({})
        setAdminCounts({})
        setSecretaryContext(null)
        setMySecretaryName(null)
        setPatientsLoading(false)
        setPatientsLoadFailed(false)
        setBootError(false)
      }
    })
    return () => {
      mounted = false
      authListener?.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const retryBoot = useCallback(() => {
    setBootError(false)
    setLoaded(false)
    if (bootRef.current) bootRef.current()
  }, [])

  // إعادة تحميل قائمة المرضى (زر "إعادة التحميل" لما يفشل الجلب)
  const reloadPatients = useCallback(async () => {
    const id = profile ? profile.id : secretaryContext ? secretaryContext.doctorProfileId : null
    if (!id) return
    setPatientsLoading(true)
    const pats = await fetchMyPatients(id)
    if (Array.isArray(pats)) {
      setPatients(pats)
      setPatientsLoadFailed(false)
    } else {
      setPatientsLoadFailed(true)
    }
    setPatientsLoading(false)
  }, [profile, secretaryContext])

  // نحفظ الكاش كل ما تغيّرت بيانات الحساب/الاشتراك (بدون بيانات مرضى). الأدمن ما بنخزّنه.
  useEffect(() => {
    const u = readStoredAuthUser()
    if (!u) return
    const validSub = mySub && !mySub.error ? mySub : null
    if (profile && profile.is_admin) {
      clearBootCache()
    } else if (profile) {
      writeBootCache({ userId: u.id, kind: 'doctor', profile, sub: validSub, secretaryName: mySecretaryName })
    } else if (secretaryContext) {
      writeBootCache({ userId: u.id, kind: 'secretary', secretaryContext, sub: validSub })
    } else if (agentData) {
      writeBootCache({ userId: u.id, kind: 'agent', agentData, agentRewards })
    }
  }, [profile, mySub, mySecretaryName, secretaryContext, agentData, agentRewards])

  const handleSignup = useCallback(
    async (email, password, phone, specialtyId, referralCode, fullName) => {
      const cleanEmail = email.trim().toLowerCase()
      const cleanPhone = phone.trim()
      if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
        return { error: t.emailTaken }
      }
      setBusy(true)
      const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password })
      if (error) {
        setBusy(false)
        const msg = (error.message || '').toLowerCase()
        if (msg.includes('already') || msg.includes('registered')) return { error: t.emailTaken }
        return { error: error.message }
      }
      const user = data.user
      if (!user) {
        setBusy(false)
        return { error: t.wrongCredentials }
      }

      const { error: signupErr } = await supabase.rpc('complete_doctor_signup', {
        p_specialty_id: specialtyId,
        p_phone: cleanPhone,
        p_full_name: fullName || null,
        p_referral_code: referralCode && referralCode.trim() ? referralCode.trim() : null
      })
      if (signupErr) {
        setBusy(false)
        return { error: signupErr.message }
      }

      if (data.session) {
        await loadProfileAndData(user.id, { specialtyId })
        setBusy(false)
        return { error: null }
      }
      setBusy(false)
      return { error: null }
    },
    [t, loadProfileAndData]
  )

  // تسجيل دخول الأطباء فقط. حساب الأدمن ما بيفوت من هون أبداً (لازم من شاشة "دخول الأدمن").
  const handleLogin = useCallback(
    async (email, password, specialtyId) => {
      const cleanEmail = email.trim().toLowerCase()
      if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
        // رسالة عامة (نفس رسالة الخطأ العادية) ولا نحاول تسجيل دخول أصلاً
        return { error: t.wrongCredentials }
      }
      if (!specialtyId) return { error: t.wrongCredentials }
      setBusy(true)
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
      if (error) {
        setBusy(false)
        return { error: t.wrongCredentials }
      }
      const res = await loadProfileAndData(data.user.id, { specialtyId })
      if (res.error) await supabase.auth.signOut()
      setBusy(false)
      return res
    },
    [t, loadProfileAndData]
  )

  // تسجيل دخول الأدمن: من شاشته فقط، وبيفتح لوحة الأدمن فقط.
  const handleAdminLogin = useCallback(
    async (email, password) => {
      const cleanEmail = email.trim().toLowerCase()
      if (cleanEmail !== ADMIN_EMAIL.toLowerCase()) {
        return { error: t.adminWrongCredentials }
      }
      setBusy(true)
      const signIn = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
      if (signIn.error) {
        setBusy(false)
        return { error: t.adminWrongCredentials }
      }
      const res = await loadProfileAndData(signIn.data.user.id, { isAdmin: true })
      if (res.error) await supabase.auth.signOut()
      setBusy(false)
      return res
    },
    [t, loadProfileAndData]
  )

  const handleAgentSignup = useCallback(
    async (email, password, phone, fullName, companyPassword) => {
      const cleanEmail = email.trim().toLowerCase()
      if (cleanEmail === ADMIN_EMAIL.toLowerCase()) return { error: t.emailTaken }
      setBusy(true)
      let { data, error } = await supabase.auth.signUp({ email: cleanEmail, password })
      if (error) {
        const msg = (error.message || '').toLowerCase()
        if (msg.includes('already') || msg.includes('registered')) {
          const retry = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
          if (retry.error) {
            setBusy(false)
            return { error: t.emailTaken }
          }
          data = retry.data
        } else {
          setBusy(false)
          return { error: error.message }
        }
      }
      const user = data.user
      if (!user) {
        setBusy(false)
        return { error: t.wrongCredentials }
      }
      const already = await loadAgentDashboard()
      if (already) {
        setBusy(false)
        return { error: null }
      }
      const { error: regErr } = await supabase.rpc('register_as_agent', {
        p_company_password: companyPassword,
        p_name: fullName,
        p_phone: phone.trim()
      })
      if (regErr) {
        setBusy(false)
        const raw = regErr.message || ''
        if (raw.includes('كلمة سر الشركة')) return { error: t.wrongCompanyPassword }
        return { error: raw || t.wrongCompanyPassword }
      }
      if (data.session) {
        setProfile(null)
        await loadAgentDashboard()
        setBusy(false)
        return { error: null }
      }
      setBusy(false)
      return { error: null }
    },
    [t, loadAgentDashboard]
  )

  const handleAgentLogin = useCallback(
    async (email, password) => {
      const cleanEmail = email.trim().toLowerCase()
      setBusy(true)
      const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password })
      if (error) {
        setBusy(false)
        return { error: t.wrongCredentials }
      }
      setProfile(null)
      const ok = await loadAgentDashboard()
      setBusy(false)
      if (!ok) return { error: t.wrongCredentials }
      return { error: null }
    },
    [t, loadAgentDashboard]
  )

  const handleSecretaryLogin = useCallback(
    async (name, password) => {
      setBusy(true)
      const { data: email, error: lookupErr } = await supabase.rpc('resolve_secretary_login', {
        p_name: name.trim(),
        p_password: password
      })
      if (lookupErr || !email) {
        setBusy(false)
        return { error: t.wrongCredentials }
      }
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      if (signInErr) {
        setBusy(false)
        return { error: t.wrongCredentials }
      }
      const ok = await loadSecretaryContext()
      setBusy(false)
      if (!ok) return { error: t.wrongCredentials }
      return { error: null }
    },
    [t, loadSecretaryContext]
  )

  const handleLogout = useCallback(async () => {
    // نلغي أي حفظ مؤجل (debounce) لسا ما انفّذ، ومنفضّي ذاكرة الصور المحمّلة —
    // منعاً لأي طلب يتنفذ بعد الخروج بجلسة مو موجودة، أو التباس لو حساب تاني سجل دخول بنفس التبويب
    Object.values(debounceTimers.current).forEach(clearTimeout)
    debounceTimers.current = {}
    loadedImagesFor.current = new Set()

    clearBootCache()
    await supabase.auth.signOut()
    setProfile(null)
    setAgentData(null)
    setAgentRewards([])
    setPatients([])
    setMySub(null)
    setSecretaryContext(null)
    setMySecretaryName(null)
  }, [])

  // الطبيب ينشئ سكرتيرة (اسم + كلمة سر) — تستبدل أي سكرتيرة سابقة تلقائياً
  const createSecretary = useCallback(
    async (name, password) => {
      const { error } = await supabase.rpc('create_secretary', { p_name: name, p_password: password })
      if (error) {
        showToast(error.message || t.saveError)
        return false
      }
      setMySecretaryName(name.trim())
      showToast(t.secretaryAdded)
      return true
    },
    [showToast, t]
  )

  // الطبيب يلغي وصول السكرتيرة الحالية
  const deleteSecretary = useCallback(async () => {
    const { error } = await supabase.rpc('delete_my_secretary')
    if (error) {
      showToast(t.saveError)
      return false
    }
    setMySecretaryName(null)
    showToast(t.secretaryRemoved)
    return true
  }, [showToast, t])

  // يجيب رقم الفاتورة التالي بأمان (محسوب ومزاد بالسيرفر، مو بالمتصفح — يمنع أي تكرار أو تلاعب برقم الفاتورة)
  const getNextInvoiceNumber = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_next_invoice_number')
    if (error) return null
    return data
  }, [])

  // الطبيب فقط (مو السكرتيرة) يقدر يرفع/يغيّر شعار العيادة
  const updateClinicLogo = useCallback(
    async (dataUrl) => {
      if (!profile) return false
      const { error } = await supabase.from('profiles').update({ clinic_logo: dataUrl }).eq('id', profile.id)
      if (error) {
        showToast(t.saveError)
        return false
      }
      setProfile((prev) => (prev ? { ...prev, clinic_logo: dataUrl } : prev))
      return true
    },
    [profile, showToast, t]
  )

  // QR شام كاش الخاص بالطبيب (يظهر بالفاتورة). الطبيب فقط.
  const updateShamcashQr = useCallback(
    async (dataUrl) => {
      if (!profile) return false
      const { error } = await supabase.from('profiles').update({ shamcash_qr: dataUrl }).eq('id', profile.id)
      if (error) {
        showToast(t.saveError)
        return false
      }
      setProfile((prev) => (prev ? { ...prev, shamcash_qr: dataUrl } : prev))
      return true
    },
    [profile, showToast, t]
  )

  // تغيير كلمة مرور الطبيب: نتحقق من الحالية (إعادة مصادقة) ثم نغيّرها. يرجع { error } أو { ok: true }
  const changePassword = useCallback(
    async (currentPassword, newPassword) => {
      if (!profile || !profile.email) return { error: t.passwordChangeError }
      if (!currentPassword || !newPassword) return { error: t.fillRequired }
      if (newPassword.length < 6) return { error: t.passwordTooShort }
      if (newPassword.length > 72) return { error: t.passwordTooLong }
      if (newPassword === currentPassword) return { error: t.passwordSameAsOld }
      const verify = await supabase.auth.signInWithPassword({ email: profile.email, password: currentPassword })
      if (verify.error) return { error: t.wrongCurrentPassword }
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) return { error: t.passwordChangeError }
      return { ok: true }
    },
    [profile, t]
  )

  // حاجز دفاعي: يمنع أي كتابة بقاعدة البيانات لو الاشتراك منتهي/ملغى
  const blockedIfExpired = useCallback(() => {
    if (mySub && isExpired(mySub)) {
      showToast(t.subscriptionBlockedAction)
      return true
    }
    return false
  }, [mySub, t, showToast])

  const addPatient = useCallback(
    async (data) => {
      if (blockedIfExpired()) return false
      const { data: row, error } = await supabase
        .from('patients')
        .insert({
          doctor_id: activeDoctorId,
          specialty_id: activeSpecialtyId,
          name: data.name,
          phone: data.phone,
          age: data.age ? Number(data.age) : null,
          next_appointment: data.nextAppointment || null,
          health_notes: ''
        })
        .select()
        .single()
      if (error) {
        showToast(t.saveError)
        return false
      }
      setPatients((prev) => [dbPatientToLocal(row), ...prev])
      showToast(t.patientAdded)
      return true
    },
    [activeDoctorId, activeSpecialtyId, blockedIfExpired, showToast, t]
  )

  const deletePatient = useCallback(
    async (id) => {
      const { error } = await supabase.from('patients').delete().eq('id', id).eq('doctor_id', activeDoctorId)
      if (error) {
        showToast(t.saveError)
        return false
      }
      setPatients((prev) => prev.filter((p) => p.id !== id))
      return true
    },
    [activeDoctorId, showToast, t]
  )

  const addSession = useCallback(
    async (patientId, sessionData) => {
      if (blockedIfExpired()) return false
      const { data: row, error } = await supabase
        .from('sessions')
        .insert({
          patient_id: patientId,
          type: sessionData.type,
          date: sessionData.date,
          price: Number(sessionData.price || 0),
          currency: sessionData.currency || 'USD',
          notes: sessionData.notes || '',
          extra_value: sessionData.extra || '',
          before_img: sessionData.beforeImg || null,
          after_img: sessionData.afterImg || null
        })
        .select()
        .single()
      if (error) {
        showToast(t.saveError)
        return false
      }
      setPatients((prev) => prev.map((p) => (p.id === patientId ? { ...p, sessions: [dbSessionToLocal(row), ...p.sessions] } : p)))
      return true
    },
    [blockedIfExpired, showToast, t]
  )

  const addPayment = useCallback(
    async (patientId, payData) => {
      if (blockedIfExpired()) return false
      const { data: row, error } = await supabase
        .from('payments')
        .insert({
          patient_id: patientId,
          amount: Number(payData.amount || 0),
          date: payData.date,
          method: payData.method,
          currency: payData.currency || 'USD',
          ...(payData.settleCurrency && Number(payData.settleAmount) > 0
            ? { settle_currency: payData.settleCurrency, settle_amount: Number(payData.settleAmount) }
            : {})
        })
        .select()
        .single()
      if (error) {
        showToast(t.saveError)
        return false
      }
      setPatients((prev) => prev.map((p) => (p.id === patientId ? { ...p, payments: [dbPaymentToLocal(row), ...p.payments] } : p)))
      return true
    },
    [blockedIfExpired, showToast, t]
  )

  const ensureSessionImagesLoaded = useCallback(async (patientId) => {
    if (loadedImagesFor.current.has(patientId)) return
    const imagesMap = await fetchSessionImages(patientId)
    if (imagesMap.error) return
    loadedImagesFor.current.add(patientId)
    if (Object.keys(imagesMap).length === 0) return
    setPatients((prev) =>
      prev.map((p) => {
        if (p.id !== patientId) return p
        return { ...p, sessions: p.sessions.map((s) => (imagesMap[s.id] ? { ...s, ...imagesMap[s.id] } : s)) }
      })
    )
  }, [])

  const writePatientField = useCallback(
    async (patientId, field, value, previousValue) => {
      const dbField = field === 'notes' ? 'health_notes' : field === 'nextAppointment' ? 'next_appointment' : field
      const { error } = await supabase
        .from('patients')
        .update({ [dbField]: value === '' ? null : value })
        .eq('id', patientId)
        .eq('doctor_id', activeDoctorId)
      if (error) {
        if (previousValue !== undefined) {
          setPatients((prev) => prev.map((p) => (p.id === patientId ? { ...p, [field]: previousValue } : p)))
        }
        showToast(t.saveError)
      }
    },
    [activeDoctorId, showToast, t]
  )

  const updatePatientField = useCallback(
    async (patientId, field, value) => {
      if (blockedIfExpired()) return
      const current = patientsRef.current.find((p) => p.id === patientId)
      const previousValue = current ? current[field] : undefined
      setPatients((prev) => prev.map((p) => (p.id === patientId ? { ...p, [field]: value } : p)))
      await writePatientField(patientId, field, value, previousValue)
    },
    [blockedIfExpired, writePatientField]
  )

  const updatePatientFieldDebounced = useCallback(
    (patientId, field, value) => {
      if (blockedIfExpired()) return
      setPatients((prev) => prev.map((p) => (p.id === patientId ? { ...p, [field]: value } : p)))
      const key = patientId + '::' + field
      if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key])
      debounceTimers.current[key] = setTimeout(() => {
        delete debounceTimers.current[key]
        writePatientField(patientId, field, value)
      }, 600)
    },
    [blockedIfExpired, writePatientField]
  )

  // طلب تجديد: بنتأكد من السيرفر إنه الطلب انحفظ فعلاً قبل ما نعرض شاشة الدفع (قبل: كان يعرضها حتى لو الطلب ما وصل).
  // note = رقم عملية التحويل (اختياري) بيوصل للأدمن مع الطلب. بيرجع true/false.
  // حذف الحساب نهائياً: كلمة السر بتنتحقق منها بالخادم. بعد النجاح منسجّل الخروج وبنفضّي الحالة.
  const deleteMyAccount = useCallback(
    async (password) => {
      const { data, error } = await supabase.rpc('delete_my_account', { p_password: password })
      if (error) {
        const msg = String(error.message || '')
        return { error: /محاولات كثيرة/.test(msg) ? msg : t.saveError }
      }
      if (data !== true) return { error: t.wrongCurrentPassword }
      await handleLogout()
      return { ok: true }
    },
    [handleLogout, t]
  )

  const requestRenewal = useCallback(
    async (plan, note) => {
      if (!profile) return false
      const { data, error } = await supabase.rpc('request_subscription_renewal', {
        p_plan: plan,
        p_note: note ? String(note).trim().slice(0, 200) : null,
        p_profile_id: profile.id
      })
      if (error || !data || data.ok !== true) {
        showToast(t.saveError)
        return false
      }
      setMySub((prev) => ({
        ...(prev && !prev.error ? prev : { status: 'active', plan: 'trial', startDate: null, endDate: null }),
        pendingPlan: data.pending_plan,
        pendingNote: data.note || '',
        pendingRequestedAt: data.requested_at || null
      }))
      return true
    },
    [profile, showToast, t]
  )

  // تحديث حالة اشتراك الطبيب من السيرفر (لما الأدمن يوافق ينفتح التطبيق تلقائياً بدون إعادة تشغيل)
  const refreshMySubscription = useCallback(async () => {
    const doctorId = profile ? profile.id : secretaryContext ? secretaryContext.doctorProfileId : null
    if (!doctorId) return null
    const sub = await fetchMySubscription(doctorId)
    if (sub && !sub.error) setMySub(sub)
    return sub
  }, [profile, secretaryContext])

  const approveSubscription = useCallback(
    async (doctorId, plan) => {
      const existing = adminSubs[doctorId]
      const base = existing && existing.status === 'active' && !isExpired(existing) ? existing.endDate : todayStr()
      const days = plan === 'yearly' ? 365 : plan === 'quarterly' ? 90 : 30
      const newSub = { status: 'active', plan, start_date: todayStr(), end_date: addDaysToDate(base, days), pending_plan: null }
      const { error: upsertErr } = await supabase.from('subscriptions').upsert({ doctor_id: doctorId, ...newSub }, { onConflict: 'doctor_id' })
      if (upsertErr) {
        showToast(t.saveError)
        return false
      }
      setAdminSubs((prev) => ({ ...prev, [doctorId]: { status: 'active', plan, startDate: newSub.start_date, endDate: newSub.end_date, pendingPlan: null } }))
      showToast(t.subscriptionApproved)
      if (plan === 'monthly' || plan === 'quarterly' || plan === 'yearly') {
        const [{ data: rewarded }, { data: agentRewarded }] = await Promise.all([
          supabase.rpc('grant_referral_reward', { p_referred_id: doctorId }),
          supabase.rpc('grant_agent_reward', { p_doctor_id: doctorId })
        ])
        if (rewarded || agentRewarded) await loadAdminData()
      }
      return true
    },
    [adminSubs, showToast, t, loadAdminData]
  )

  const rejectSubscription = useCallback(
    async (doctorId) => {
      const { error } = await supabase.from('subscriptions').update({ pending_plan: null }).eq('doctor_id', doctorId)
      if (error) {
        showToast(t.saveError)
        return false
      }
      setAdminSubs((prev) => ({ ...prev, [doctorId]: { ...prev[doctorId], pendingPlan: null } }))
      return true
    },
    [showToast, t]
  )

  const revokeSubscription = useCallback(
    async (doctorId) => {
      const { error } = await supabase.from('subscriptions').update({ status: 'revoked', end_date: todayStr(), pending_plan: null }).eq('doctor_id', doctorId)
      if (error) {
        showToast(t.saveError)
        return false
      }
      setAdminSubs((prev) => ({ ...prev, [doctorId]: { ...prev[doctorId], status: 'revoked', endDate: todayStr(), pendingPlan: null } }))
      showToast(t.subscriptionRevoked)
      return true
    },
    [showToast, t]
  )

  const deleteAgentAccount = useCallback(
    async (agentId) => {
      const { data: ok, error } = await supabase.rpc('admin_delete_agent', { p_agent_id: agentId })
      if (error || !ok) {
        showToast(t.saveError)
        return false
      }
      setAdminAgents((prev) => prev.filter((a) => a.id !== agentId))
      await loadAdminData()
      showToast(t.agentDeleted)
      return true
    },
    [showToast, t, loadAdminData]
  )

  const deleteDoctorAccount = useCallback(
    async (profileId) => {
      const { data: ok, error } = await supabase.rpc('admin_delete_doctor', { p_profile_id: profileId })
      if (error || !ok) {
        showToast(t.saveError)
        return false
      }
      setAdminProfiles((prev) => prev.filter((p) => p.id !== profileId))
      setAdminSubs((prev) => {
        const n = { ...prev }
        delete n[profileId]
        return n
      })
      setAdminCounts((prev) => {
        const n = { ...prev }
        delete n[profileId]
        return n
      })
      showToast(t.doctorDeleted)
      return true
    },
    [showToast, t]
  )

  const session = useMemo(() => {
    if (profile) {
      return profile.is_admin ? { isAdmin: true } : { email: profile.email, specialtyId: profile.specialty_id, id: profile.id }
    }
    if (secretaryContext) {
      return {
        isSecretary: true,
        email: secretaryContext.doctorEmail,
        specialtyId: secretaryContext.specialtyId,
        secretaryName: secretaryContext.secretaryName
      }
    }
    return agentData ? { isAgent: true, name: agentData.name, code: agentData.code } : null
  }, [profile, agentData, secretaryContext])

  const currentSpecialty = session && !session.isAdmin && !session.isAgent ? specialties[activeSpecialtyId] : null
  const currentSub = session && !session.isAdmin && !session.isAgent ? mySub : null

  const value = {
    lang,
    setLang,
    t,
    loaded,
    busy,
    toast,
    showToast,
    profile,
    session,
    agentData,
    agentRewards,
    secretaryContext,
    mySecretaryName,
    activeClinicLogo,
    getNextInvoiceNumber,
    updateClinicLogo,
    updateShamcashQr,
    changePassword,
    activeShamcashQr,
    specialties,
    patients,
    mySub,
    currentSpecialty,
    currentSub,
    adminProfiles,
    adminSubs,
    adminCounts,
    adminOverview,
    adminAgents,
    adminAgentRewards,
    adminSecretaries,
    handleLogin,
    handleAdminLogin,
    handleSignup,
    handleLogout,
    handleAgentLogin,
    handleAgentSignup,
    handleSecretaryLogin,
    createSecretary,
    deleteSecretary,
    addPatient,
    deletePatient,
    addSession,
    addPayment,
    ensureSessionImagesLoaded,
    updatePatientField,
    updatePatientFieldDebounced,
    requestRenewal,
    bootError,
    retryBoot,
    patientsLoading,
    patientsLoadFailed,
    reloadPatients,
    deleteMyAccount,
    refreshMySubscription,
    refreshAdminData: loadAdminData,
    approveSubscription,
    rejectSubscription,
    revokeSubscription,
    deleteDoctorAccount,
    deleteAgentAccount
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth يجب أن يُستخدم داخل AuthProvider')
  return ctx
}
