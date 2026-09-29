create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_id, slug)
);

alter table public.concepts add column if not exists subject_id uuid references public.subjects(id) on delete set null;
alter table public.concepts add column if not exists topic_id uuid references public.topics(id) on delete set null;
alter table public.concepts add column if not exists learning_objective text;
alter table public.concepts add column if not exists misconceptions jsonb not null default '[]'::jsonb;

create table if not exists public.learning_content (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid not null references public.concepts(id) on delete cascade,
  content_type text not null check (content_type in ('LESSON', 'EXPLANATION', 'WORKED_EXAMPLE', 'SUMMARY', 'PRACTICE', 'REVIEW', 'REMEDIATION')),
  title text not null,
  description text,
  body jsonb not null default '{}'::jsonb,
  difficulty text not null default 'BEGINNER' check (difficulty in ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
  estimated_minutes integer not null default 5 check (estimated_minutes > 0),
  order_index integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  version integer not null default 1 check (version > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (concept_id, order_index, version)
);

create index if not exists topics_subject_id_idx on public.topics(subject_id);
create index if not exists concepts_subject_id_idx on public.concepts(subject_id);
create index if not exists concepts_topic_id_idx on public.concepts(topic_id);
create index if not exists learning_content_concept_active_idx on public.learning_content(concept_id, is_active, order_index);

create trigger subjects_set_updated_at before update on public.subjects for each row execute function public.set_updated_at();
create trigger topics_set_updated_at before update on public.topics for each row execute function public.set_updated_at();
create trigger learning_content_set_updated_at before update on public.learning_content for each row execute function public.set_updated_at();

alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.learning_content enable row level security;

create policy subjects_select_authenticated on public.subjects for select to authenticated using (true);
create policy topics_select_authenticated on public.topics for select to authenticated using (true);
create policy learning_content_select_authenticated on public.learning_content for select to authenticated using (is_active = true);
