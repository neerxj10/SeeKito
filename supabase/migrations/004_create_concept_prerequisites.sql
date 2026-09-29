create table public.concept_prerequisites (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid not null references public.concepts(id) on delete restrict,
  prerequisite_concept_id uuid not null references public.concepts(id) on delete restrict,
  required_mastery numeric(4,3) not null default 0.7 check (required_mastery between 0 and 1),
  priority integer not null default 0 check (priority >= 0),
  created_at timestamptz not null default now(),
  unique (concept_id, prerequisite_concept_id),
  check (concept_id <> prerequisite_concept_id)
);

