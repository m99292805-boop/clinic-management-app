-- إصلاح حذف الحسابات من لوحة الأدمن (كان يفشل بسبب مفاتيح FK وعدم حذف حسابات السكرتيرات)
-- (مُطبَّق على قاعدة البيانات أصلاً؛ هذا الملف للتوثيق وإعادة التطبيق)
alter table public.agent_rewards alter column doctor_id drop not null;
alter table public.agent_rewards drop constraint if exists agent_rewards_doctor_id_fkey;
alter table public.agent_rewards add constraint agent_rewards_doctor_id_fkey foreign key (doctor_id) references public.profiles(id) on delete set null;
alter table public.specialties drop constraint if exists specialties_created_by_fkey;
alter table public.specialties add constraint specialties_created_by_fkey foreign key (created_by) references public.profiles(id) on delete set null;
alter table public.referral_rewards drop constraint if exists referral_rewards_referrer_id_fkey;
alter table public.referral_rewards add constraint referral_rewards_referrer_id_fkey foreign key (referrer_id) references public.profiles(id) on delete cascade;
alter table public.referral_rewards drop constraint if exists referral_rewards_referred_id_fkey;
alter table public.referral_rewards add constraint referral_rewards_referred_id_fkey foreign key (referred_id) references public.profiles(id) on delete cascade;
alter table public.profiles drop constraint if exists profiles_referred_by_fkey;
alter table public.profiles add constraint profiles_referred_by_fkey foreign key (referred_by) references public.profiles(id) on delete set null;
alter table public.profiles drop constraint if exists profiles_agent_id_fkey;
alter table public.profiles add constraint profiles_agent_id_fkey foreign key (agent_id) references public.agents(id) on delete set null;

create or replace function public.admin_delete_doctor(p_profile_id uuid)
returns boolean language plpgsql security definer set search_path to 'public' as $function$
declare v_user_id uuid; v_deleted_count int; v_other_profiles_count int;
begin
  if not public.is_admin() then raise exception 'الأدمن فقط يقدر يحذف حساب طبيب'; end if;
  select user_id into v_user_id from public.profiles where id = p_profile_id and is_admin = false;
  if v_user_id is null then return false; end if;
  delete from auth.users where id in (select user_id from public.secretaries where doctor_id = p_profile_id);
  delete from public.profiles where id = p_profile_id;
  get diagnostics v_deleted_count = row_count;
  if v_deleted_count = 0 then return false; end if;
  select count(*) into v_other_profiles_count from public.profiles where user_id = v_user_id;
  if v_other_profiles_count = 0 then delete from auth.users where id = v_user_id; end if;
  return true;
end;
$function$;
revoke all on function public.admin_delete_doctor(uuid) from public, anon;
grant execute on function public.admin_delete_doctor(uuid) to authenticated;

-- حذف حساب موظف/مسوّق من لوحة الأدمن (مُطبَّق على القاعدة أصلاً)
alter table public.agent_rewards drop constraint if exists agent_rewards_agent_id_fkey;
alter table public.agent_rewards add constraint agent_rewards_agent_id_fkey foreign key (agent_id) references public.agents(id) on delete cascade;

create or replace function public.admin_delete_agent(p_agent_id uuid)
returns boolean language plpgsql security definer set search_path to 'public' as $function$
declare v_user_id uuid; v_deleted int;
begin
  if not public.is_admin() then raise exception 'الأدمن فقط يقدر يحذف حساب موظف/مسوّق'; end if;
  select user_id into v_user_id from public.agents where id = p_agent_id;
  if v_user_id is null then return false; end if;
  delete from public.agents where id = p_agent_id;
  get diagnostics v_deleted = row_count;
  if v_deleted = 0 then return false; end if;
  if not exists (select 1 from public.profiles where user_id = v_user_id)
     and not exists (select 1 from public.secretaries where user_id = v_user_id) then
    delete from auth.users where id = v_user_id;
  end if;
  return true;
end;
$function$;
revoke all on function public.admin_delete_agent(uuid) from public, anon;
grant execute on function public.admin_delete_agent(uuid) to authenticated;

-- ============ طلبات التجديد: موثوقية + ظهورها للأدمن (مُطبَّق على القاعدة أصلاً) ============
alter table public.subscriptions add column if not exists pending_requested_at timestamptz;
alter table public.subscriptions add column if not exists payment_note text;
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'subscriptions_status_valid') then
    alter table public.subscriptions add constraint subscriptions_status_valid check (status in ('active','expired','revoked')) not valid; end if;
  if not exists (select 1 from pg_constraint where conname = 'subscriptions_plan_valid') then
    alter table public.subscriptions add constraint subscriptions_plan_valid check (plan in ('trial','monthly','quarterly','yearly')) not valid; end if;
  if not exists (select 1 from pg_constraint where conname = 'subscriptions_pending_plan_valid') then
    alter table public.subscriptions add constraint subscriptions_pending_plan_valid check (pending_plan is null or pending_plan in ('monthly','quarterly','yearly')) not valid; end if;
  if not exists (select 1 from pg_constraint where conname = 'subscriptions_payment_note_len') then
    alter table public.subscriptions add constraint subscriptions_payment_note_len check (payment_note is null or length(payment_note) <= 200) not valid; end if;
end $$;

drop function if exists public.request_subscription_renewal(text);
create or replace function public.request_subscription_renewal(p_plan text, p_note text default null, p_profile_id uuid default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare v_doctor_id uuid; v_status text; v_note text := nullif(trim(coalesce(p_note, '')), '');
begin
  if auth.uid() is null then raise exception 'يجب تسجيل الدخول أولاً'; end if;
  if p_profile_id is not null then
    select id into v_doctor_id from profiles where id = p_profile_id and user_id = auth.uid() and is_admin = false;
  else
    select id into v_doctor_id from profiles where user_id = auth.uid() and is_admin = false order by created_at limit 1;
  end if;
  if v_doctor_id is null then raise exception 'يجب تسجيل الدخول كطبيب لطلب التجديد'; end if;
  if p_plan is not null and p_plan not in ('monthly', 'quarterly', 'yearly') then raise exception 'باقة غير صحيحة'; end if;
  if v_note is not null and length(v_note) > 200 then raise exception 'الملاحظة طويلة جداً'; end if;
  insert into subscriptions (doctor_id, status, plan, start_date, end_date)
  values (v_doctor_id, 'active', 'trial', current_date - 1, current_date - 1) on conflict (doctor_id) do nothing;
  select status into v_status from subscriptions where doctor_id = v_doctor_id;
  if v_status = 'revoked' then raise exception 'الحساب موقوف، تواصل مع الإدارة'; end if;
  if p_plan is null then
    update subscriptions set pending_plan = null, updated_at = now() where doctor_id = v_doctor_id;
  else
    update subscriptions set pending_plan = p_plan, pending_requested_at = now(),
           payment_note = coalesce(v_note, case when pending_plan is distinct from p_plan then null else payment_note end), updated_at = now()
     where doctor_id = v_doctor_id;
  end if;
  return (select jsonb_build_object('ok', true, 'pending_plan', s.pending_plan, 'requested_at', s.pending_requested_at, 'note', s.payment_note)
          from subscriptions s where s.doctor_id = v_doctor_id);
end;
$function$;
revoke all on function public.request_subscription_renewal(text, text, uuid) from public, anon;
grant execute on function public.request_subscription_renewal(text, text, uuid) to authenticated;

create or replace function public.subscriptions_clear_pending()
returns trigger language plpgsql set search_path to 'public' as $$
begin
  if NEW.pending_plan is null then NEW.pending_requested_at := null; NEW.payment_note := null; end if;
  return NEW;
end;
$$;
drop trigger if exists trg_subscriptions_pending_clear on public.subscriptions;
create trigger trg_subscriptions_pending_clear before insert or update on public.subscriptions
for each row execute function public.subscriptions_clear_pending();

-- ============ عدّادات الأدمن + بيانات الطبيب (أرقام مجمّعة فقط) — مُطبَّق على القاعدة أصلاً ============
create or replace function public.admin_doctors_overview()
returns jsonb language plpgsql stable security definer set search_path to 'public' as $function$
begin
  if not public.is_admin() then raise exception 'الأدمن فقط'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'doctor_id', p.id, 'patients', coalesce(pt.n, 0), 'sessions', coalesce(se.n, 0),
      'billed', coalesce(se.billed, '{}'::jsonb), 'collected', coalesce(pa.collected, '{}'::jsonb),
      'last_activity', greatest(pt.last_at, se.last_at, pa.last_at)))
    from public.profiles p
    left join lateral (select count(*)::int as n, max(x.created_at) as last_at from public.patients x where x.doctor_id = p.id) pt on true
    left join lateral (
      select count(*)::int as n, max(s.created_at) as last_at,
             (select jsonb_object_agg(q.cur, q.tot) from (select s2.currency as cur, sum(s2.price) as tot
                from public.sessions s2 join public.patients x2 on x2.id = s2.patient_id where x2.doctor_id = p.id group by s2.currency) q) as billed
      from public.sessions s join public.patients x on x.id = s.patient_id where x.doctor_id = p.id) se on true
    left join lateral (
      select max(pa2.created_at) as last_at,
             (select jsonb_object_agg(q.cur, q.tot) from (select pa3.currency as cur, sum(pa3.amount) as tot
                from public.payments pa3 join public.patients x3 on x3.id = pa3.patient_id where x3.doctor_id = p.id group by pa3.currency) q) as collected
      from public.payments pa2 join public.patients x4 on x4.id = pa2.patient_id where x4.doctor_id = p.id) pa on true
    where p.is_admin = false), '[]'::jsonb);
end;
$function$;
revoke all on function public.admin_doctors_overview() from public, anon;
grant execute on function public.admin_doctors_overview() to authenticated;

-- الأدمن ما عاد يقرأ صفوف المرضى مباشرة (خصوصية + حماية لو انسرق حساب الأدمن)
drop policy if exists patients_select_admin on public.patients;
-- للتراجع (غير مُوصى به): create policy patients_select_admin on public.patients for select using (public.is_admin());

-- ============ الطبيب الملغى اشتراكه يقدر يرسل طلب تجديد للأدمن (مُطبَّق على القاعدة أصلاً) ============
-- (تم حذف شرط رفض الحساب الموقوف من request_subscription_renewal؛ الحالة تبقى revoked إلى أن يعتمد الأدمن الطلب)
-- النص الكامل للدالة بنفس الصيغة أعلاه في قسم "طلبات التجديد" مع حذف الفقرة:
--   select status into v_status ...; if v_status = 'revoked' then raise exception ... end if;
-- وإضافة 'status' إلى jsonb المُرجَع.

-- ============ حذف الحساب ذاتياً (مطلوب من Google Play) — مُطبَّق على القاعدة أصلاً ============
create or replace function public.delete_my_account(p_password text)
returns boolean language plpgsql security definer set search_path to 'public' as $function$
declare v_uid uuid := auth.uid(); v_hash text; v_bucket text;
begin
  if v_uid is null then raise exception 'يجب تسجيل الدخول أولاً'; end if;
  v_bucket := 'del:' || v_uid::text;
  if public._throttle_blocked(v_bucket) then raise exception 'محاولات كثيرة. حاول لاحقاً بعد قليل'; end if;
  if exists (select 1 from public.profiles where user_id = v_uid and is_admin = true) then raise exception 'لا يمكن حذف حساب مدير النظام من هنا'; end if;
  if exists (select 1 from public.secretaries where user_id = v_uid) then raise exception 'حساب السكرتيرة يحذفه الطبيب من الإعدادات'; end if;
  select encrypted_password into v_hash from auth.users where id = v_uid;
  if v_hash is null or length(coalesce(p_password, '')) = 0 or length(p_password) > 200 or v_hash <> extensions.crypt(p_password, v_hash) then
    perform public._throttle_fail(v_bucket, 5, interval '15 minutes', interval '30 minutes'); return false;
  end if;
  delete from auth.users where id in (select s.user_id from public.secretaries s join public.profiles p on p.id = s.doctor_id where p.user_id = v_uid);
  delete from public.profiles where user_id = v_uid and is_admin = false;
  delete from public.agents where user_id = v_uid;
  delete from auth.users where id = v_uid;
  perform public._throttle_reset(v_bucket);
  return true;
end;
$function$;
revoke all on function public.delete_my_account(text) from public, anon;
grant execute on function public.delete_my_account(text) to authenticated;

-- ملاحظة (13/10): ترقية Capacitor إلى 8 / Android API 36 لا تحتاج أي تغيير في قاعدة البيانات.

-- ============ دفعة بعملة مختلفة عن عملة الدين (مُطبَّق على القاعدة أصلاً) ============
alter table public.payments add column if not exists settle_currency text;
alter table public.payments add column if not exists settle_amount numeric;
alter table public.payments drop constraint if exists payments_settle_valid;
alter table public.payments add constraint payments_settle_valid check (
  (settle_currency is null and settle_amount is null)
  or (settle_currency is not null and settle_amount is not null
      and settle_currency in ('USD','SYP','IQD','SAR','AED','EGP','JOD','LBP','KWD','QAR','BHD','OMR','YER','LYD','TND','MAD','DZD','SDG','TRY','EUR','GBP','CAD','AUD','CHF','JPY','CNY','INR','RUB')
      and settle_amount > 0 and settle_amount <= 1000000000000)
) not valid;
