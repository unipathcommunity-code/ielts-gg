-- ─────────────────────────────────────────────────────────────────────────────
-- kmw.bb IELTS — content schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor → New query).
-- Decouples test content (passages, questions, keys, vocab) from the app code so
-- new tests / languages can be added without a redeploy.
-- ─────────────────────────────────────────────────────────────────────────────

-- READING ─────────────────────────────────────────────────────────────────────
create table if not exists reading_passages (
  id          text primary key,                 -- e.g. 'universe'
  title       text not null,
  paragraphs  jsonb not null,                   -- [{ "label": "A", "text": "..." }]
  lang        text not null default 'en',       -- future: 'ko', 'zh', ...
  order_index int  not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists reading_questions (
  id          uuid primary key default gen_random_uuid(),
  passage_id  text not null references reading_passages(id) on delete cascade,
  qid         text not null,                    -- 'q1'
  kind        text not null,                    -- 'matching' | 'tf'
  number      text not null,                    -- '1.'
  prompt      text not null,                    -- full question text
  short_label text,                             -- compact label for the scorecard
  answer_key  text not null,                    -- 'D', 'TRUE', 'NOT GIVEN'
  order_index int  not null default 0,
  unique (passage_id, qid)
);

create table if not exists reading_vocab (
  id          uuid primary key default gen_random_uuid(),
  passage_id  text not null references reading_passages(id) on delete cascade,
  word        text not null,
  definition  text not null,
  translation text not null,
  order_index int  not null default 0
);

-- LISTENING ───────────────────────────────────────────────────────────────────
create table if not exists listening_tests (
  id          text primary key,                 -- e.g. 'campus'
  title       text not null,
  sentences   jsonb not null,                   -- ["Welcome to ...", ...] (TTS lines)
  transcript_html text not null default '',     -- highlighted transcript (rendered as HTML)
  lang        text not null default 'en',
  order_index int  not null default 0,
  created_at  timestamptz not null default now()
);

create table if not exists listening_questions (
  id          uuid primary key default gen_random_uuid(),
  test_id     text not null references listening_tests(id) on delete cascade,
  qid         text not null,                    -- 'q1'
  prompt      text not null,                    -- question / note label
  options     jsonb,                            -- [{ "value":"A", "label":"North building" }] for MCQ; null for fill-in
  answer_key  text not null,
  order_index int  not null default 0,
  unique (test_id, qid)
);

create table if not exists listening_vocab (
  id          uuid primary key default gen_random_uuid(),
  test_id     text not null references listening_tests(id) on delete cascade,
  word        text not null,
  definition  text not null,
  translation text not null,
  order_index int  not null default 0
);

-- READ-ONLY PUBLIC ACCESS ─────────────────────────────────────────────────────
-- Content is public (no secrets). Enable RLS and allow anon SELECT only.
alter table reading_passages   enable row level security;
alter table reading_questions  enable row level security;
alter table reading_vocab      enable row level security;
alter table listening_tests    enable row level security;
alter table listening_questions enable row level security;
alter table listening_vocab    enable row level security;

do $$
declare t text;
begin
  foreach t in array array[
    'reading_passages','reading_questions','reading_vocab',
    'listening_tests','listening_questions','listening_vocab'
  ] loop
    execute format(
      'drop policy if exists "public read" on %I; create policy "public read" on %I for select using (true);',
      t, t
    );
  end loop;
end $$;

-- CERTIFICATES ────────────────────────────────────────────────────────────────
-- First per-user table: each row belongs to exactly one auth.users row, RLS-scoped
-- so a user can only see/insert their own certificates (client uses the anon key).
create table if not exists certificates (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  full_name    text not null,
  exam_format  text not null,          -- english|russian|japanese|korean|chinese
  exam_name    text not null,          -- IELTS|TRKI|TOPIK|HSK|JLPT
  score_label  text not null,          -- "IELTS Band" | "TOPIK Darajasi" ...
  native_score text not null,         -- "7.0" | "4-Daraja" | "HSK 4" ...
  band_numeric numeric not null,
  verify_code  text not null unique,
  issued_at    timestamptz not null default now()
);

alter table certificates enable row level security;

drop policy if exists "own certificates select" on certificates;
create policy "own certificates select" on certificates
  for select using (auth.uid() = user_id);

drop policy if exists "own certificates insert" on certificates;
create policy "own certificates insert" on certificates
  for insert with check (auth.uid() = user_id);
