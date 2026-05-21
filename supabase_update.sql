-- 1. 포인트 컬럼 추가
alter table public.profiles add column if not exists points int default 0;

-- 2. 사진첩 테이블
create table if not exists public.photos (
  id uuid default gen_random_uuid() primary key,
  url text not null,
  caption text default '',
  uploaded_by uuid references public.profiles(id),
  uploader_name text not null,
  created_at timestamptz default now()
);
alter table public.photos enable row level security;

create policy "로그인 회원은 사진 조회 가능" on public.photos
  for select using (auth.role() = 'authenticated');

create policy "관리자만 사진 업로드" on public.photos
  for insert with check (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "관리자만 사진 삭제" on public.photos
  for delete using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 3. 관리자가 포인트 수정 가능하도록 profiles 정책 추가
create policy "관리자는 모든 프로필 수정 가능" on public.profiles
  for update using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- 4. 사진 Storage 버킷
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "인증 사용자 사진 조회" on storage.objects
  for select using (bucket_id = 'photos' and auth.role() = 'authenticated');

create policy "관리자만 사진 업로드" on storage.objects
  for insert with check (
    bucket_id = 'photos' and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "관리자만 사진 삭제" on storage.objects
  for delete using (
    bucket_id = 'photos' and
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
