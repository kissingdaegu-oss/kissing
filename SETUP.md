# 키씽 앱 설정 가이드

## 1단계 — Supabase 프로젝트 생성

1. [supabase.com](https://supabase.com) 에서 무료 계정 가입
2. **New project** 클릭 → 이름: `kissing`, 비밀번호 설정, 지역: `Northeast Asia (Seoul)` 선택
3. 프로젝트 생성 후 **Settings → API** 페이지에서 아래 두 값 복사:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

## 2단계 — .env 파일 설정

프로젝트 루트의 `.env` 파일을 열어서 값을 채워넣으세요:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

## 3단계 — 데이터베이스 테이블 생성

Supabase 대시보드 → **SQL Editor** → `New query` 클릭 →
`supabase_setup.sql` 파일 내용을 전체 복사해서 붙여넣고 **Run** 클릭

## 4단계 — Storage 버킷 생성

Supabase 대시보드 → **Storage** → **New bucket**
- Bucket name: `library`
- Public bucket: ✅ 체크
- **Save** 클릭

그다음 `library` 버킷 선택 → **Policies** 탭 → 아래 정책 추가:

**읽기 (모든 인증 사용자):**
```sql
(auth.role() = 'authenticated')
```

**쓰기 (관리자만):**
```sql
exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
```

## 5단계 — Supabase Auth 설정

Supabase 대시보드 → **Authentication → URL Configuration**
- Site URL: 개발 시 `http://localhost:5173`, 배포 후 Vercel URL로 변경

## 6단계 — 로컬 실행

```bash
npm run dev
```

→ http://localhost:5173 접속

**첫 번째 가입한 계정이 자동으로 관리자가 됩니다.**

---

## 배포 (Vercel)

### 방법 A — GitHub 연동 (권장)

1. GitHub에 새 저장소 생성 후 코드 push
2. [vercel.com](https://vercel.com) → **New Project** → GitHub 저장소 import
3. **Environment Variables** 에 `.env` 값 추가:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. **Deploy** 클릭 → `https://kissing.vercel.app` 발급

### 방법 B — Vercel CLI

```bash
npm install -g vercel
vercel
```

배포 후 Supabase Authentication → URL Configuration → Site URL을 Vercel URL로 업데이트하세요.

---

## 관리자 추가 방법

Supabase 대시보드 → **Table Editor → profiles** →
원하는 회원의 `role` 컬럼을 `admin` 으로 직접 수정
