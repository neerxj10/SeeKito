create table public.concepts (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  difficulty numeric(4,3) not null default 0.5 check (difficulty between 0 and 1),
  diagnostic_weight numeric(4,3) not null default 1.0 check (diagnostic_weight between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger concepts_set_updated_at
before update on public.concepts
for each row execute function public.set_updated_at();

