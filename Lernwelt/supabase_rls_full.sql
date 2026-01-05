-- Supabase RLS setup for HSGG-Lernwelt (2026-01-04)
-- Apply in Supabase SQL Editor. Re-run safely: policies are dropped before re-create.

-- ============ OPTIONAL: Parent-Child mapping table (used by RLS) ============
-- If your schema already has such a table, adjust the name/columns below.
create table if not exists public.parent_child (
  parent_id uuid not null references public.profiles(id) on delete cascade,
  child_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (parent_id, child_id)
);

-- ============ OPTIONAL: Ownership fields on content tables ============
-- Only if not present; useful to restrict edits to creator.
alter table if exists public.materials
  add column if not exists created_by uuid default auth.uid();

alter table if exists public.questions
  add column if not exists created_by uuid default auth.uid();

alter table if exists public.appointments
  add column if not exists created_by uuid default auth.uid();

-- ============ PROFILES ============
alter table public.profiles enable row level security;

-- Drop old policies if they exist
drop policy if exists "profiles: read self" on public.profiles;
drop policy if exists "profiles: read admin" on public.profiles;
drop policy if exists "profiles: teacher reads students in own classes" on public.profiles;
drop policy if exists "profiles: parent reads own children" on public.profiles;
drop policy if exists "profiles: update self" on public.profiles;
drop policy if exists "profiles: admin update all" on public.profiles;
drop policy if exists "profiles: admin delete (no-admin targets)" on public.profiles;

-- SELECT: self
create policy "profiles: read self" on public.profiles
for select using (id = auth.uid());

-- SELECT: admin sees all
create policy "profiles: read admin" on public.profiles
for select using (
  exists (select 1 from public.profiles a where a.id = auth.uid() and a.role = 'admin')
);

-- SELECT: teacher sees students in their classes
create policy "profiles: teacher reads students in own classes" on public.profiles
for select using (
  exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'teacher')
  and role = 'student'
  and class_id in (
    select tr.class_id from public.teacher_role tr where tr.teacher_id = auth.uid()
  )
);

-- SELECT: parent sees own children and own profile
create policy "profiles: parent reads own children" on public.profiles
for select using (
  (
    exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'parent')
    and (
      id = auth.uid() or id in (
        select pc.child_id from public.parent_child pc where pc.parent_id = auth.uid()
      )
    )
  )
);

-- UPDATE: self (safe fields only; protected via trigger below)
create policy "profiles: update self" on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

-- UPDATE: admin may update all
create policy "profiles: admin update all" on public.profiles
for update using (
  exists (select 1 from public.profiles a where a.id = auth.uid() and a.role = 'admin')
) with check (
  exists (select 1 from public.profiles a where a.id = auth.uid() and a.role = 'admin')
);

-- DELETE: admin can delete non-admin profiles
create policy "profiles: admin delete (no-admin targets)" on public.profiles
for delete using (
  exists (select 1 from public.profiles a where a.id = auth.uid() and a.role = 'admin')
  and role <> 'admin'
);

-- Protect sensitive columns on profiles for non-admin via trigger
create or replace function public.protect_profile_sensitive_fields()
returns trigger language plpgsql as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if not exists (select 1 from public.profiles a where a.id = auth.uid() and a.role = 'admin') then
    if (new.role is distinct from old.role)
       or (new.editing_right is distinct from old.editing_right)
       or (new.class_id is distinct from old.class_id) then
      raise exception 'Insufficient rights to change protected profile fields';
    end if;
  end if;
  return new;
end; $$;

drop trigger if exists trg_protect_profiles on public.profiles;
create trigger trg_protect_profiles
before update on public.profiles
for each row execute function public.protect_profile_sensitive_fields();

-- ============ CLASSES ============
alter table public.classes enable row level security;

drop policy if exists "classes: read all" on public.classes;
drop policy if exists "classes: admin crud" on public.classes;

-- Everyone (even anon) can read classes (used by registration)
create policy "classes: read all" on public.classes
for select using (true);

-- Only admin can insert/update/delete classes
create policy "classes: admin crud" on public.classes
for all using (
  exists (select 1 from public.profiles a where a.id = auth.uid() and a.role = 'admin')
) with check (
  exists (select 1 from public.profiles a where a.id = auth.uid() and a.role = 'admin')
);

-- ============ TEACHER_ROLE ============
alter table public.teacher_role enable row level security;

drop policy if exists "teacher_role: select self or admin" on public.teacher_role;
drop policy if exists "teacher_role: insert self or admin" on public.teacher_role;
drop policy if exists "teacher_role: delete self or admin" on public.teacher_role;

create policy "teacher_role: select self or admin" on public.teacher_role
for select using (
  teacher_id = auth.uid() or exists (select 1 from public.profiles a where a.id = auth.uid() and a.role = 'admin')
);

create policy "teacher_role: insert self or admin" on public.teacher_role
for insert with check (
  teacher_id = auth.uid() or exists (select 1 from public.profiles a where a.id = auth.uid() and a.role = 'admin')
);

create policy "teacher_role: delete self or admin" on public.teacher_role
for delete using (
  teacher_id = auth.uid() or exists (select 1 from public.profiles a where a.id = auth.uid() and a.role = 'admin')
);

-- ============ QUESTIONS ============
-- Parents should not access games/questions; allow only student/teacher/admin
alter table public.questions enable row level security;

drop policy if exists "questions: select allowed roles" on public.questions;
drop policy if exists "questions: insert staff" on public.questions;
drop policy if exists "questions: update staff or owner" on public.questions;
drop policy if exists "questions: delete staff or owner" on public.questions;

create policy "questions: select allowed roles" on public.questions
for select using (
  exists (
    select 1 from public.profiles me
    where me.id = auth.uid() and me.role in ('student','teacher','admin')
  )
);

create policy "questions: insert staff" on public.questions
for insert with check (
  exists (
    select 1 from public.profiles me
    where me.id = auth.uid() and (me.role in ('teacher','admin') or me.editing_right = true)
  )
);

create policy "questions: update staff or owner" on public.questions
for update using (
  (created_by = auth.uid()) or exists (select 1 from public.profiles me where me.id = auth.uid() and (me.role in ('teacher','admin') or me.editing_right = true))
) with check (
  (created_by = auth.uid()) or exists (select 1 from public.profiles me where me.id = auth.uid() and (me.role in ('teacher','admin') or me.editing_right = true))
);

create policy "questions: delete staff or owner" on public.questions
for delete using (
  (created_by = auth.uid()) or exists (select 1 from public.profiles me where me.id = auth.uid() and (me.role in ('teacher','admin') or me.editing_right = true))
);

-- ============ MATERIALS ============
alter table public.materials enable row level security;

drop policy if exists "materials: select all" on public.materials;
drop policy if exists "materials: insert staff" on public.materials;
drop policy if exists "materials: update staff or owner" on public.materials;
drop policy if exists "materials: delete staff or owner" on public.materials;

-- Everyone (incl. anon) can read materials overview/content
create policy "materials: select all" on public.materials
for select using (true);

create policy "materials: insert staff" on public.materials
for insert with check (
  exists (
    select 1 from public.profiles me
    where me.id = auth.uid() and (me.role in ('teacher','admin') or me.editing_right = true)
  )
);

create policy "materials: update staff or owner" on public.materials
for update using (
  (created_by = auth.uid()) or exists (select 1 from public.profiles me where me.id = auth.uid() and (me.role in ('teacher','admin') or me.editing_right = true))
) with check (
  (created_by = auth.uid()) or exists (select 1 from public.profiles me where me.id = auth.uid() and (me.role in ('teacher','admin') or me.editing_right = true))
);

create policy "materials: delete staff or owner" on public.materials
for delete using (
  (created_by = auth.uid()) or exists (select 1 from public.profiles me where me.id = auth.uid() and (me.role in ('teacher','admin') or me.editing_right = true))
);

-- ============ APPOINTMENTS ============
alter table public.appointments enable row level security;

drop policy if exists "appointments: select all" on public.appointments;
drop policy if exists "appointments: insert staff" on public.appointments;
drop policy if exists "appointments: update staff or owner" on public.appointments;
drop policy if exists "appointments: delete staff or owner" on public.appointments;

create policy "appointments: select all" on public.appointments
for select using (true);

create policy "appointments: insert staff" on public.appointments
for insert with check (
  exists (
    select 1 from public.profiles me
    where me.id = auth.uid() and (me.role in ('teacher','admin') or me.editing_right = true)
  )
);

create policy "appointments: update staff or owner" on public.appointments
for update using (
  (created_by = auth.uid()) or exists (select 1 from public.profiles me where me.id = auth.uid() and (me.role in ('teacher','admin') or me.editing_right = true))
) with check (
  (created_by = auth.uid()) or exists (select 1 from public.profiles me where me.id = auth.uid() and (me.role in ('teacher','admin') or me.editing_right = true))
);

create policy "appointments: delete staff or owner" on public.appointments
for delete using (
  (created_by = auth.uid()) or exists (select 1 from public.profiles me where me.id = auth.uid() and (me.role in ('teacher','admin') or me.editing_right = true))
);

-- ============ STORAGE (Bucket: lehrmaterialien) ============
-- Public read; write only for teacher/admin/redakteure
-- Note: storage policies use storage.objects (NOT the bucket name directly)

-- Enable RLS for storage.objects (enabled by default in Supabase projects)
alter table if exists storage.objects enable row level security;

-- Drop policies
drop policy if exists "storage: lehrmaterialien read public" on storage.objects;
drop policy if exists "storage: lehrmaterialien write staff insert" on storage.objects;
drop policy if exists "storage: lehrmaterialien write staff update" on storage.objects;
drop policy if exists "storage: lehrmaterialien write staff delete" on storage.objects;

-- READ: public (anyone) can read objects from this bucket
create policy "storage: lehrmaterialien read public" on storage.objects
for select using (bucket_id = 'lehrmaterialien');

-- INSERT: only authenticated teachers/admins/redakteure may upload into bucket
create policy "storage: lehrmaterialien write staff insert" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'lehrmaterialien' and exists (
    select 1 from public.profiles me
    where me.id = auth.uid() and (me.role in ('teacher','admin') or me.editing_right = true)
  )
);

-- UPDATE: only authenticated teachers/admins/redakteure may update
create policy "storage: lehrmaterialien write staff update" on storage.objects
for update to authenticated
using (
  bucket_id = 'lehrmaterialien' and exists (
    select 1 from public.profiles me
    where me.id = auth.uid() and (me.role in ('teacher','admin') or me.editing_right = true)
  )
) with check (
  bucket_id = 'lehrmaterialien' and exists (
    select 1 from public.profiles me
    where me.id = auth.uid() and (me.role in ('teacher','admin') or me.editing_right = true)
  )
);

-- DELETE: only authenticated teachers/admins/redakteure may delete
create policy "storage: lehrmaterialien write staff delete" on storage.objects
for delete to authenticated
using (
  bucket_id = 'lehrmaterialien' and exists (
    select 1 from public.profiles me
    where me.id = auth.uid() and (me.role in ('teacher','admin') or me.editing_right = true)
  )
);

-- ============ NOTES ============
-- 1) Parents: can read materials/appointments (open read), and via parent_child can read only their children's profiles.
--    They cannot select questions due to the questions SELECT policy (no 'parent' role allowed), thus no Spiele.
-- 2) Admin-only features (create classes, change roles/editing_right): enforced via admin policies and the profile trigger.
-- 3) Consider adding owner columns to other content tables if you want creator-only edits beyond role checks.
-- 4) After applying, test with student/teacher/parent/admin accounts.

