-- ─────────────────────────────────────────────────────────────────────────────
-- kmb.education — v2 sxemasi: foydalanuvchi progressi, yo'nalishlar, obuna, kontent banki
--
-- Supabase Dashboard → SQL Editor → New query da ishga tushiring.
-- Bu fayl `schema.sql` ni ALMASHTIRMAYDI — uning ustiga qo'shiladi. Mavjud
-- reading_*/listening_*/certificates jadvallariga tegilmaydi.
--
-- Barcha per-user jadvallar `certificates` dagi RLS naqshini aynan takrorlaydi:
-- klient anon kalit bilan ishlaydi, shuning uchun har bir qatorga `auth.uid()`
-- bo'yicha cheklov qo'yiladi. Pul va kvota bilan bog'liq jadvallarga
-- (entitlements, usage_events, promo_codes) klient YOZA OLMAYDI — faqat
-- SUPABASE_SECRET_KEY bilan ishlaydigan server route'lari yozadi.
-- ─────────────────────────────────────────────────────────────────────────────

-- PROFILES ────────────────────────────────────────────────────────────────────
create table if not exists profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  full_name    text,
  active_track text,                                  -- 'ielts' | 'multilevel' | 'grammar-en' ...
  native_lang  text not null default 'uz',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ENROLLMENTS — user × yo'nalish. Har yo'nalishning O'Z rejasi va o'z maqsadi. ──
create table if not exists enrollments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  track_id      text not null,
  start_level   text,                                 -- funnel'da tanlangan boshlang'ich daraja
  target_score  text,                                 -- '7.0' | 'B2' | '4-daraja'
  weakness      text,                                 -- 'writing' | 'speaking' ...
  deadline      date,
  streak_days   int  not null default 0,
  last_active   date,
  created_at    timestamptz not null default now(),
  unique (user_id, track_id)
);

-- ATTEMPTS — har bir test urinishi. localStorage'dagi ielts_test_history o'rniga. ─
create table if not exists attempts (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  -- Klientda yaratilgan barqaror id ('reading_1723...'). localStorage'dagi tarixni
  -- Supabase bilan takrorsiz birlashtirish uchun kerak.
  client_id    text not null,
  track_id     text not null,
  skill        text not null,                          -- reading|listening|writing|speaking|mock
  content_id   text,                                   -- qaysi matn/test topshirilgan
  band         numeric not null,                       -- ichki 0-9 ekvivalenti (shkala o'girish UI'da)
  correct      int,
  total        int,
  duration_sec int,
  detail       jsonb not null default '{}'::jsonb,     -- javoblar, kriteriyalar, AI izohlari
  created_at   timestamptz not null default now(),
  unique (user_id, client_id)
);

create index if not exists attempts_user_track_idx on attempts (user_id, track_id, created_at desc);

-- VOCAB SRS — intervalli takror. localStorage'dagi ielts_vocab_srs o'rniga. ─────
create table if not exists vocab_srs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  track_id    text not null,
  word        text not null,
  translation text,
  definition  text,
  ease        numeric not null default 2.5,
  interval_d  int     not null default 0,
  reps        int     not null default 0,
  due_at      timestamptz not null default now(),
  created_at  timestamptz not null default now(),
  unique (user_id, track_id, word)
);

create index if not exists vocab_srs_due_idx on vocab_srs (user_id, due_at);

-- LESSON PROGRESS — grammatika/kurs darslari. ─────────────────────────────────
create table if not exists lesson_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  track_id     text not null,
  lesson_id    text not null,
  status       text not null default 'in_progress',    -- in_progress | done
  score        numeric,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  unique (user_id, track_id, lesson_id)
);

-- ENTITLEMENTS — kim nimaga haqli. FAQAT server yozadi. ───────────────────────
create table if not exists entitlements (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  plan       text not null,                            -- 'free' | 'pro' | 'org'
  source     text not null,                            -- 'promo' | 'payment' | 'manual' | 'trial'
  org_id     uuid,
  starts_at  timestamptz not null default now(),
  expires_at timestamptz,                              -- null = muddatsiz
  note       text,
  created_at timestamptz not null default now()
);

create index if not exists entitlements_user_idx on entitlements (user_id, expires_at desc);

-- USAGE EVENTS — AI chaqiruvlar hisobi (kvota + xarajat nazorati). Server yozadi. ─
create table if not exists usage_events (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  anon_key   text,                                     -- login qilmaganlar uchun barmoq izi
  kind       text not null,                            -- 'evaluate' | 'chat' | 'tts' | 'generate'
  track_id   text,
  units      int  not null default 1,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_day_idx on usage_events (user_id, created_at desc);

-- PROMO CODES — Pro'ni qo'lda ochish. Klient umuman ko'ra olmaydi. ────────────
create table if not exists promo_codes (
  code        text primary key,
  plan        text not null default 'pro',
  days        int  not null default 30,
  max_uses    int  not null default 1,
  used_count  int  not null default 0,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

create table if not exists promo_redemptions (
  id         uuid primary key default gen_random_uuid(),
  code       text not null references promo_codes(code) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (code, user_id)
);

-- CONTENT ITEMS — universal kontent banki (koddagi hardcode o'rniga). ─────────
create table if not exists content_items (
  id            text primary key,                      -- 'ielts:reading:universe'
  track_id      text not null,
  skill         text not null,
  level         text,                                  -- 'B1' | 'easy' | 'HSK 4'
  part          int,
  title         text not null,
  payload       jsonb not null,                        -- matn + savollar + kalitlar + lug'at
  source        text not null default 'curated',       -- 'curated' | 'ai'
  status        text not null default 'draft',         -- 'draft' | 'published'
  quality_score numeric,
  order_index   int not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists content_items_track_idx on content_items (track_id, skill, status, order_index);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────────────────────

-- 1) O'z qatorini to'liq boshqaradigan jadvallar
do $$
declare t text;
begin
  foreach t in array array['profiles','enrollments','attempts','vocab_srs','lesson_progress'] loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "own rows select" on %I;', t);
    execute format('create policy "own rows select" on %I for select using (auth.uid() = user_id);', t);
    execute format('drop policy if exists "own rows insert" on %I;', t);
    execute format('create policy "own rows insert" on %I for insert with check (auth.uid() = user_id);', t);
    execute format('drop policy if exists "own rows update" on %I;', t);
    execute format('create policy "own rows update" on %I for update using (auth.uid() = user_id) with check (auth.uid() = user_id);', t);
    execute format('drop policy if exists "own rows delete" on %I;', t);
    execute format('create policy "own rows delete" on %I for delete using (auth.uid() = user_id);', t);
  end loop;
end $$;

-- 2) Faqat O'QISH mumkin bo'lgan jadvallar — yozishni faqat server (secret key) qiladi.
--    Bu yerda INSERT/UPDATE siyosati YO'Q: anon/authenticated kalit hech narsa yoza olmaydi.
do $$
declare t text;
begin
  foreach t in array array['entitlements','usage_events','promo_redemptions'] loop
    execute format('alter table %I enable row level security;', t);
    execute format('drop policy if exists "own rows select" on %I;', t);
    execute format('create policy "own rows select" on %I for select using (auth.uid() = user_id);', t);
  end loop;
end $$;

-- 3) promo_codes — klient uchun mutlaqo yopiq (siyosat yo'q = hech kim ko'rmaydi).
alter table promo_codes enable row level security;

-- 4) content_items — faqat 'published' qatorlar hammaga ochiq, yozish serverda.
alter table content_items enable row level security;
drop policy if exists "published read" on content_items;
create policy "published read" on content_items
  for select using (status = 'published');

-- ─────────────────────────────────────────────────────────────────────────────
-- Yordamchi: bugungi AI sarfini sanash (kvota tekshiruvi uchun).
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function usage_today(p_user uuid, p_kind text)
returns int
language sql
security definer
set search_path = public
as $$
  select coalesce(sum(units), 0)::int
  from usage_events
  where user_id = p_user
    and kind = p_kind
    and created_at >= date_trunc('day', now());
$$;
