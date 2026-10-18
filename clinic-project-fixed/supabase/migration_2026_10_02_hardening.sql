-- =====================================================================
-- ترقية: صلاحية السكرتيرة + QR شام كاش + منع التخمين + تقليص الصلاحيات
-- آمنة للتشغيل أكثر من مرة (idempotent)
-- =====================================================================

-- 1) عمود QR شام كاش للطبيب + حدود أحجام لمنع تعبئة القاعدة بملفات ضخمة
alter table public.profiles add column if not exists shamcash_qr text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_shamcash_qr_size') then
    alter table public.profiles add constraint profiles_shamcash_qr_size
      check (shamcash_qr is null or length(shamcash_qr) <= 600000) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'profiles_clinic_logo_size') then
    alter table public.profiles add constraint profiles_clinic_logo_size
      check (clinic_logo is null or length(clinic_logo) <= 300000) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'sessions_price_range') then
    alter table public.sessions add constraint sessions_price_range
      check (price >= 0 and price <= 1000000000000) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'sessions_currency_valid') then
    alter table public.sessions add constraint sessions_currency_valid
      check (currency in ('USD','SYP','IQD','SAR','AED','EGP','JOD','LBP','KWD','QAR','BHD','OMR','YER','LYD','TND','MAD','DZD','SDG','TRY','EUR','GBP','CAD','AUD','CHF','JPY','CNY','INR','RUB')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'sessions_images_size') then
    alter table public.sessions add constraint sessions_images_size
      check ((before_img is null or length(before_img) <= 2500000) and (after_img is null or length(after_img) <= 2500000)) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'payments_amount_range') then
    alter table public.payments add constraint payments_amount_range
      check (amount > 0 and amount <= 1000000000000) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'payments_currency_valid') then
    alter table public.payments add constraint payments_currency_valid
      check (currency in ('USD','SYP','IQD','SAR','AED','EGP','JOD','LBP','KWD','QAR','BHD','OMR','YER','LYD','TND','MAD','DZD','SDG','TRY','EUR','GBP','CAD','AUD','CHF','JPY','CNY','INR','RUB')) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'patients_text_limits') then
    alter table public.patients add constraint patients_text_limits
      check (length(name) <= 150 and coalesce(length(phone),0) <= 40 and coalesce(length(health_notes),0) <= 10000 and coalesce(length(extra_field),0) <= 500) not valid;
  end if;
end $$;

-- 2) السكرتيرة تقدر تقرأ اشتراك طبيبها (لتعرف إذا منتهي) بدون ما تشوف خطط الدفع
drop policy if exists subscriptions_select_secretary on public.subscriptions;
create policy subscriptions_select_secretary on public.subscriptions
  for select to authenticated
  using (public.owns_or_is_secretary_of(doctor_id));

-- 3) سياق السكرتيرة يشمل QR الطبيب أيضاً
drop function if exists public.get_my_secretary_context();
create function public.get_my_secretary_context()
returns table(doctor_profile_id uuid, doctor_email text, specialty_id text, secretary_name text, clinic_logo text, shamcash_qr text)
language sql stable security definer set search_path = public as $$
  select p.id, p.email, p.specialty_id, s.name, p.clinic_logo, p.shamcash_qr
  from public.secretaries s
  join public.profiles p on p.id = s.doctor_id
  where s.user_id = auth.uid();
$$;
revoke all on function public.get_my_secretary_context() from public, anon;
grant execute on function public.get_my_secretary_context() to authenticated;

-- 4) حارس البروفايل: منع تعديل id/email/specialty_id/created_at من غير الأدمن
create or replace function public.profiles_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    if NEW.id is distinct from OLD.id then raise exception 'لا يمكن تعديل المعرّف'; end if;
    if NEW.email is distinct from OLD.email then raise exception 'لا يمكن تعديل البريد من هنا'; end if;
    if NEW.specialty_id is distinct from OLD.specialty_id then raise exception 'لا يمكن تغيير الاختصاص'; end if;
    if NEW.created_at is distinct from OLD.created_at then raise exception 'لا يمكن تعديل تاريخ الإنشاء'; end if;
    if NEW.is_admin is distinct from OLD.is_admin then
      raise exception 'لا يمكن تعديل صلاحية الأدمن إلا من حساب إداري';
    end if;
    if NEW.user_id is distinct from OLD.user_id then raise exception 'لا يمكن تعديل معرّف المستخدم'; end if;
    if NEW.referred_by is distinct from OLD.referred_by then raise exception 'لا يمكن تعديل من دعاك بعد إنشاء الحساب'; end if;
    if NEW.agent_id is distinct from OLD.agent_id then raise exception 'لا يمكن تعديل كود الموظف/المسوّق بعد إنشاء الحساب'; end if;
    if NEW.referral_reward_granted is distinct from OLD.referral_reward_granted then raise exception 'هاد الحقل للنظام فقط'; end if;
    if NEW.agent_reward_granted is distinct from OLD.agent_reward_granted then raise exception 'هاد الحقل للنظام فقط'; end if;
    if NEW.referral_code is distinct from OLD.referral_code then raise exception 'لا يمكن تغيير كود الدعوة'; end if;
    if NEW.next_invoice_number is distinct from OLD.next_invoice_number
       and coalesce(current_setting('app.allow_invoice_update', true), '') <> 'true' then
      raise exception 'رقم الفاتورة يُدار تلقائياً من النظام فقط';
    end if;
  end if;
  return NEW;
end;
$$;

-- 5) جدول تقييد المحاولات (منع تخمين كلمات السر)؛ لا أحد يقرأه أو يكتب فيه مباشرة
create table if not exists public.auth_throttle (
  bucket text primary key,
  attempts int not null default 0,
  window_start timestamptz not null default now(),
  blocked_until timestamptz
);
alter table public.auth_throttle enable row level security;
revoke all on public.auth_throttle from public, anon, authenticated;

create or replace function public._throttle_blocked(p_bucket text)
returns boolean language sql security definer set search_path = public as $$
  select coalesce((select blocked_until > now() from public.auth_throttle where bucket = p_bucket), false);
$$;

create or replace function public._throttle_fail(p_bucket text, p_max int, p_window interval, p_block interval)
returns void language plpgsql security definer set search_path = public as $$
begin
  delete from public.auth_throttle
   where window_start < now() - interval '1 day' and (blocked_until is null or blocked_until < now());
  insert into public.auth_throttle as t (bucket, attempts, window_start)
  values (p_bucket, 1, now())
  on conflict (bucket) do update set
    attempts = case when t.window_start < now() - p_window then 1 else t.attempts + 1 end,
    window_start = case when t.window_start < now() - p_window then now() else t.window_start end,
    blocked_until = case
      when (case when t.window_start < now() - p_window then 1 else t.attempts + 1 end) >= p_max
      then now() + p_block else t.blocked_until end;
end;
$$;

create or replace function public._throttle_reset(p_bucket text)
returns void language sql security definer set search_path = public as $$
  delete from public.auth_throttle where bucket = p_bucket;
$$;
revoke all on function public._throttle_blocked(text), public._throttle_fail(text,int,interval,interval), public._throttle_reset(text) from public, anon, authenticated;

-- 6) دخول السكرتيرة: تقييد 5 محاولات خاطئة/15 دقيقة لكل اسم + فحص كل المطابقات
create or replace function public.resolve_secretary_login(p_name text, p_password text)
returns text language plpgsql security definer set search_path = public as $$
declare
  r record;
  v_bucket text := 'sec:' || lower(trim(coalesce(p_name, '')));
begin
  if length(coalesce(p_name,'')) = 0 or length(coalesce(p_password,'')) = 0 or length(p_name) > 100 or length(p_password) > 200 then
    return null;
  end if;
  if public._throttle_blocked(v_bucket) then
    return null;
  end if;
  for r in
    select au.email, au.encrypted_password
    from public.secretaries s
    join auth.users au on au.id = s.user_id
    where lower(s.name) = lower(trim(p_name))
  loop
    if r.encrypted_password = extensions.crypt(p_password, r.encrypted_password) then
      perform public._throttle_reset(v_bucket);
      return r.email;
    end if;
  end loop;
  perform public._throttle_fail(v_bucket, 5, interval '15 minutes', interval '15 minutes');
  return null;
end;
$$;

-- 7) تسجيل المسوّق: تقييد التخمين على كلمة سر الشركة (يرجع null عند الخطأ بدل raise حتى يُحفظ العدّاد)
create or replace function public.register_as_agent(p_company_password text, p_name text, p_phone text)
returns text language plpgsql security definer set search_path = public as $$
declare
  v_code text;
  v_bucket text := 'agent:' || coalesce(auth.uid()::text, 'anon');
begin
  if auth.uid() is null then
    raise exception 'يجب تسجيل الدخول أولاً';
  end if;
  if public._throttle_blocked(v_bucket) then
    raise exception 'محاولات كثيرة. حاول لاحقاً بعد قليل';
  end if;
  if p_company_password is distinct from 'BN654321BN' then
    perform public._throttle_fail(v_bucket, 5, interval '30 minutes', interval '60 minutes');
    return null;
  end if;
  if length(trim(coalesce(p_name,''))) = 0 or length(p_name) > 100 or length(coalesce(p_phone,'')) > 40 then
    raise exception 'بيانات غير صحيحة';
  end if;
  if exists(select 1 from public.agents where user_id = auth.uid()) then
    raise exception 'عندك حساب موظف مسجّل أصلاً';
  end if;
  perform public._throttle_reset(v_bucket);
  v_code := public.generate_unique_code();
  insert into public.agents (user_id, name, phone, code) values (auth.uid(), trim(p_name), p_phone, v_code);
  return v_code;
end;
$$;

-- 8) إنشاء سكرتيرة: اسم فريد عالمياً (حتى ما يتلخبط الدخول) وحدود أطوال
create or replace function public.create_secretary(p_name text, p_password text)
returns boolean language plpgsql security definer set search_path = public as $$
declare
  v_doctor_id uuid;
  v_new_user_id uuid := gen_random_uuid();
  v_synthetic_email text := 'secretary_' || replace(gen_random_uuid()::text, '-', '') || '@internal.clinicapp';
begin
  select id into v_doctor_id from profiles where user_id = auth.uid() and is_admin = false limit 1;
  if v_doctor_id is null then
    raise exception 'يجب تسجيل الدخول كطبيب لإضافة سكرتيرة';
  end if;
  if length(trim(coalesce(p_name,''))) = 0 then raise exception 'اسم السكرتيرة مطلوب'; end if;
  if length(p_name) > 60 then raise exception 'اسم السكرتيرة طويل جداً'; end if;
  if length(coalesce(p_password,'')) < 6 then raise exception 'كلمة السر يجب أن تكون 6 أحرف على الأقل'; end if;
  if length(p_password) > 72 then raise exception 'كلمة السر طويلة جداً'; end if;
  if exists (select 1 from secretaries where lower(name) = lower(trim(p_name)) and doctor_id <> v_doctor_id) then
    raise exception 'هذا الاسم مستخدم، اختر اسماً آخر';
  end if;

  delete from auth.users where id in (select user_id from secretaries where doctor_id = v_doctor_id);

  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, created_at, updated_at,
    raw_app_meta_data, raw_user_meta_data,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', v_new_user_id, 'authenticated', 'authenticated',
    v_synthetic_email, extensions.crypt(p_password, extensions.gen_salt('bf')),
    now(), now(), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    '', '', '', ''
  );
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), v_new_user_id, v_new_user_id::text,
          jsonb_build_object('sub', v_new_user_id::text, 'email', v_synthetic_email),
          'email', now(), now(), now());
  insert into secretaries (doctor_id, user_id, name) values (v_doctor_id, v_new_user_id, trim(p_name));
  return true;
end;
$$;

-- 9) تقليص الصلاحيات: الزائر (anon) ما يلمس أي جدول إلا قراءة الاختصاصات (لشاشة الدخول)
revoke all on all tables in schema public from anon;
grant select on public.specialties to anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;
revoke execute on function public.generate_unique_code() from authenticated;
