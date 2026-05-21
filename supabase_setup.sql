-- 1. 프로필 테이블
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  part text not null check (part in ('soprano','alto','countertenor','tenor','baritone','bass','percussion')),
  role text not null default 'member' check (role in ('admin','member')),
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

create policy "로그인 회원은 프로필 조회 가능" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "본인 프로필만 수정" on public.profiles
  for update using (auth.uid() = id);

create policy "본인 프로필 생성" on public.profiles
  for insert with check (auth.uid() = id);

-- 2. 일정 테이블
create table public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  type text not null check (type in ('rehearsal','performance','meeting')),
  date date not null,
  time time,
  location text default '',
  description text default '',
  created_by uuid references public.profiles(id),
  created_at timestamptz default now()
);
alter table public.events enable row level security;

create policy "로그인 회원은 일정 조회 가능" on public.events
  for select using (auth.role() = 'authenticated');

create policy "관리자만 일정 생성" on public.events
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "관리자만 일정 수정" on public.events
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "관리자만 일정 삭제" on public.events
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 3. 출석 테이블
create table public.attendance (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  checked boolean default false,
  updated_at timestamptz default now(),
  unique (event_id, user_id)
);
alter table public.attendance enable row level security;

create policy "로그인 회원은 출석 조회 가능" on public.attendance
  for select using (auth.role() = 'authenticated');

create policy "관리자만 출석 생성" on public.attendance
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "관리자만 출석 수정" on public.attendance
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 4. 자료실 테이블
create table public.library (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  type text not null check (type in ('score','audio','other')),
  file_url text not null,
  file_name text not null,
  uploaded_by uuid references public.profiles(id),
  uploader_name text not null,
  description text default '',
  created_at timestamptz default now()
);
alter table public.library enable row level security;

create policy "로그인 회원은 자료 조회 가능" on public.library
  for select using (auth.role() = 'authenticated');

create policy "관리자만 자료 업로드" on public.library
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "관리자만 자료 삭제" on public.library
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 5. Storage 버킷 (Supabase 대시보드에서 직접 생성하거나 아래 실행)
-- insert into storage.buckets (id, name, public) values ('library', 'library', true);
