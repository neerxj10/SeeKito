alter table public.concepts add column if not exists slug text;
alter table public.concepts add column if not exists subject text;
alter table public.concepts add column if not exists estimated_minutes integer;
alter table public.concepts add column if not exists is_active boolean not null default true;

-- The original local baseline used numeric difficulty values, while the
-- current target database already stores BEGINNER/INTERMEDIATE/ADVANCED text.
-- Inspect the live column type first. Numeric bucketing is executed only for
-- the numeric baseline; existing text values are preserved byte-for-byte.
do $$
declare
  difficulty_type text;
begin
  select data_type
    into difficulty_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'concepts'
    and column_name = 'difficulty';

  if difficulty_type in ('numeric', 'real', 'double precision') then
    alter table public.concepts drop constraint if exists concepts_difficulty_check;
    alter table public.concepts
      alter column difficulty type text using (
        case
          when difficulty < 0.34 then 'BEGINNER'
          when difficulty < 0.67 then 'INTERMEDIATE'
          else 'ADVANCED'
        end
      );
  elsif difficulty_type = 'text' then
    null;
  else
    raise exception 'Unsupported public.concepts.difficulty type: %', difficulty_type;
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where c.conname = 'concepts_difficulty_check'
      and t.relname = 'concepts'
      and n.nspname = 'public'
  ) then
    alter table public.concepts
      add constraint concepts_difficulty_check
      check (difficulty in ('BEGINNER', 'INTERMEDIATE', 'ADVANCED'));
  end if;
end;
$$;

update public.concepts
set
  slug = regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g'),
  subject = 'general',
  estimated_minutes = 30
where slug is null;

alter table public.concepts
  alter column slug set not null,
  alter column subject set not null,
  alter column estimated_minutes set not null,
  add constraint concepts_estimated_minutes_check check (estimated_minutes > 0);

create unique index if not exists concepts_subject_slug_idx on public.concepts(subject, slug);
create unique index if not exists concepts_subject_name_idx on public.concepts(subject, name);
create index if not exists concepts_subject_active_idx on public.concepts(subject, is_active);
