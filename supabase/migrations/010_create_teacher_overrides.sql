create table public.teacher_overrides (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.teachers(id) on delete restrict,
  student_id uuid not null references public.students(id) on delete restrict,
  concept_id uuid not null references public.concepts(id) on delete restrict,
  previous_action text not null check (previous_action in ('diagnostic', 'teach_prerequisite', 'practice', 'remediation', 'review', 'advance', 'teacher_intervention')),
  new_action text not null check (new_action in ('diagnostic', 'teach_prerequisite', 'practice', 'remediation', 'review', 'advance', 'teacher_intervention')),
  reason text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger teacher_overrides_set_updated_at
before update on public.teacher_overrides
for each row execute function public.set_updated_at();

