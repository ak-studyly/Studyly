-- ============================================================
-- STUDYLY — SUPABASE SCHEMA
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ──────────────────────────────────────────
-- COLLEGES
-- ──────────────────────────────────────────
create table public.colleges (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  city        text not null,
  state       text not null,
  approved    boolean not null default false,  -- admin reviews new colleges
  created_at  timestamptz not null default now()
);

-- Anyone can read approved colleges
create policy "Public read approved colleges"
  on public.colleges for select
  using (approved = true);

-- Anyone can submit a new college (pending approval)
create policy "Anyone can submit college"
  on public.colleges for insert
  with check (approved = false);

alter table public.colleges enable row level security;

-- ──────────────────────────────────────────
-- PROFILES (extends Supabase auth.users)
-- Created automatically on sign-up via trigger
-- ──────────────────────────────────────────
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  college_id  uuid references public.colleges(id),
  branch      text,
  year        smallint check (year between 1 and 4),
  section     text,
  -- role: 'cr' | 'announcer' | null (students have no role)
  role        text check (role in ('cr', 'announcer')),
  -- CR who granted this announcer role (null if role = 'cr' or null)
  granted_by  uuid references public.profiles(id),
  dark_mode   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Users can read their own profile
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

alter table public.profiles enable row level security;

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ──────────────────────────────────────────
-- ANNOUNCEMENTS
-- ──────────────────────────────────────────
create table public.announcements (
  id            uuid primary key default uuid_generate_v4(),
  college_id    uuid not null references public.colleges(id),
  branch        text not null,
  year          smallint not null check (year between 1 and 4),
  section       text not null,
  author_id     uuid not null references public.profiles(id),
  body          text not null,
  -- source tag: 'principal' | 'dean' | 'college' | 'cr' | 'announcer'
  source_tag    text not null default 'cr' check (source_tag in ('principal', 'dean', 'college', 'cr', 'announcer')),
  is_pinned     boolean not null default false,
  attachment_url  text,
  attachment_name text,
  created_at    timestamptz not null default now()
);

-- Public read — anyone can view announcements for any section
create policy "Public read announcements"
  on public.announcements for select
  using (true);

-- Only CR/announcers of matching section can post
create policy "CR and announcers can post"
  on public.announcements for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('cr', 'announcer')
        and p.college_id = college_id
        and p.branch = branch
        and p.year = year
        and p.section = section
    )
  );

-- Only CR can pin/unpin and only author can delete
create policy "Author or CR can update"
  on public.announcements for update
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'cr'
        and p.college_id = college_id
        and p.branch = branch
        and p.year = year
        and p.section = section
    )
  );

create policy "Author or CR can delete"
  on public.announcements for delete
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'cr'
        and p.college_id = college_id
        and p.branch = branch
        and p.year = year
        and p.section = section
    )
  );

alter table public.announcements enable row level security;

-- ──────────────────────────────────────────
-- IMPORTANT DATES
-- ──────────────────────────────────────────
create table public.important_dates (
  id          uuid primary key default uuid_generate_v4(),
  college_id  uuid not null references public.colleges(id),
  branch      text not null,
  year        smallint not null check (year between 1 and 4),
  section     text not null,
  author_id   uuid not null references public.profiles(id),
  title       text not null,
  description text,
  date        date not null,
  -- type: 'exam' | 'submission' | 'event'
  type        text not null default 'event' check (type in ('exam', 'submission', 'event')),
  created_at  timestamptz not null default now()
);

create policy "Public read dates"
  on public.important_dates for select
  using (true);

create policy "CR and announcers can add dates"
  on public.important_dates for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid()
        and p.role in ('cr', 'announcer')
        and p.college_id = college_id
        and p.branch = branch
        and p.year = year
        and p.section = section
    )
  );

create policy "CR can delete dates"
  on public.important_dates for delete
  using (
    author_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'cr'
        and p.college_id = college_id
    )
  );

alter table public.important_dates enable row level security;

-- ──────────────────────────────────────────
-- MATERIALS
-- ──────────────────────────────────────────
create table public.materials (
  id            uuid primary key default uuid_generate_v4(),
  college_id    uuid not null references public.colleges(id),
  branch        text not null,
  year          smallint not null check (year between 1 and 4),
  subject       text,
  title         text not null,
  -- type: 'notes' | 'past_paper' | 'slides' | 'summary'
  type          text not null check (type in ('notes', 'past_paper', 'slides', 'summary')),
  file_url      text not null,
  file_name     text not null,
  file_size     bigint,
  uploader_id   uuid references public.profiles(id),
  uploader_name text not null default 'anonymous',
  upvotes       integer not null default 0,
  -- pending review before public visibility
  approved      boolean not null default false,
  created_at    timestamptz not null default now()
);

-- Only approved materials are publicly readable
create policy "Public read approved materials"
  on public.materials for select
  using (approved = true);

-- Anyone can upload (guest or signed-in)
create policy "Anyone can upload material"
  on public.materials for insert
  with check (true);

alter table public.materials enable row level security;

-- ──────────────────────────────────────────
-- MATERIAL VOTES (prevents double-voting)
-- ──────────────────────────────────────────
create table public.material_votes (
  material_id   uuid not null references public.materials(id) on delete cascade,
  -- use IP hash for guests, user id for signed-in
  voter_key     text not null,
  created_at    timestamptz not null default now(),
  primary key (material_id, voter_key)
);

create policy "Public read votes"
  on public.material_votes for select using (true);

create policy "Anyone can vote"
  on public.material_votes for insert with check (true);

alter table public.material_votes enable row level security;

-- ──────────────────────────────────────────
-- STORAGE BUCKETS
-- Run separately in Supabase Dashboard → Storage
-- ──────────────────────────────────────────
-- Bucket: "materials"  → public: false, max file size: 20MB
-- Bucket: "attachments" → public: false, max file size: 10MB
-- (Create these manually in your Supabase dashboard)

-- ──────────────────────────────────────────
-- INDEXES for common queries
-- ──────────────────────────────────────────
create index on public.announcements (college_id, branch, year, section, created_at desc);
create index on public.important_dates (college_id, branch, year, section, date asc);
create index on public.materials (college_id, branch, year, approved, created_at desc);
create index on public.profiles (college_id, branch, year, section, role);
