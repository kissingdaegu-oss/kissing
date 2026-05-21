import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import { Part, PART_LABELS, EVENT_TYPE_LABELS } from '../types'
import { CheckCircle2, XCircle, Star, KeyRound, UserPen } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useEffect } from 'react'

const PARTS = Object.entries(PART_LABELS) as [Part, string][]

interface InfoForm { name: string; part: Part }
interface PwForm { current: string; next: string; confirm: string }

export default function Profile() {
  const { profile, refreshProfile, user } = useAuth()
  const [tab, setTab] = useState<'info' | 'attendance' | 'password'>('info')
  const [editMode, setEditMode] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([])

  const infoForm = useForm<InfoForm>({
    defaultValues: { name: profile?.name ?? '', part: profile?.part ?? 'soprano' }
  })
  const pwForm = useForm<PwForm>()

  useEffect(() => {
    if (tab === 'attendance') loadAttendance()
  }, [tab])

  const loadAttendance = async () => {
    const { data } = await supabase
      .from('attendance')
      .select('*, events(title, date, type)')
      .eq('user_id', user!.id)
      .order('updated_at', { ascending: false })
    setAttendanceHistory(data ?? [])
  }

  const onSaveInfo = async (data: InfoForm) => {
    setMsg(''); setError('')
    const { error } = await supabase
      .from('profiles')
      .update({ name: data.name, part: data.part })
      .eq('id', user!.id)
    if (error) { setError('저장에 실패했습니다.'); return }
    await refreshProfile(user!.id)
    setEditMode(false)
    setMsg('저장됐습니다!')
  }

  const onChangePw = async (data: PwForm) => {
    setMsg(''); setError('')
    if (data.next !== data.confirm) { setError('새 비밀번호가 일치하지 않습니다.'); return }
    if (data.next.length < 6) { setError('비밀번호는 6자 이상이어야 합니다.'); return }
    const { error } = await supabase.auth.updateUser({ password: data.next })
    if (error) { setError(error.message); return }
    setMsg('비밀번호가 변경됐습니다!')
    pwForm.reset()
  }

  const checkedCount = attendanceHistory.filter(r => r.checked).length
  const rate = attendanceHistory.length > 0
    ? Math.round((checkedCount / attendanceHistory.length) * 100) : 0

  if (!profile) return null

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* 프로필 카드 */}
      <div className="card bg-gradient-to-br from-primary-400 to-secondary-400 text-white border-0">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-extrabold">
            {profile.name[0]}
          </div>
          <div>
            <p className="font-extrabold text-lg">{profile.name}</p>
            <p className="text-primary-100 text-sm">{PART_LABELS[profile.part]} 파트</p>
            {profile.role === 'admin' && (
              <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full mt-0.5 inline-block">관리자</span>
            )}
          </div>
          <div className="ml-auto text-right">
            <div className="flex items-center gap-1 justify-end">
              <Star size={16} className="text-yellow-300 fill-yellow-300" />
              <span className="font-extrabold text-lg">{profile.points ?? 0}</span>
            </div>
            <p className="text-primary-100 text-xs">포인트</p>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 bg-white rounded-2xl p-1 border border-primary-100">
        {(['info', 'attendance', 'password'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setMsg(''); setError(''); setEditMode(false) }}
            className={`flex-1 text-sm font-semibold py-2 rounded-xl transition-colors ${
              tab === t ? 'bg-primary-400 text-white' : 'text-gray-500 hover:text-primary-500'
            }`}
          >
            {t === 'info' ? '내 정보' : t === 'attendance' ? '출석 기록' : '비밀번호'}
          </button>
        ))}
      </div>

      {msg && <div className="bg-primary-50 text-primary-600 text-sm rounded-xl px-4 py-2.5 font-semibold">{msg}</div>}
      {error && <div className="bg-rose-50 text-rose-500 text-sm rounded-xl px-4 py-2.5">{error}</div>}

      {/* 내 정보 탭 */}
      {tab === 'info' && (
        <div className="card space-y-4">
          {!editMode ? (
            <>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">이름</span>
                  <span className="font-semibold text-gray-800">{profile.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">파트</span>
                  <span className="font-semibold text-gray-800">{PART_LABELS[profile.part]}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">역할</span>
                  <span className="font-semibold text-gray-800">{profile.role === 'admin' ? '관리자' : '일반 회원'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">가입일</span>
                  <span className="font-semibold text-gray-800">
                    {format(parseISO(profile.created_at), 'yyyy년 M월 d일', { locale: ko })}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  infoForm.setValue('name', profile.name)
                  infoForm.setValue('part', profile.part)
                  setEditMode(true)
                }}
                className="btn-secondary w-full flex items-center justify-center gap-2"
              >
                <UserPen size={16} /> 정보 수정
              </button>
            </>
          ) : (
            <form onSubmit={infoForm.handleSubmit(onSaveInfo)} className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">이름</label>
                <input {...infoForm.register('name', { required: true })} className="input" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-600 mb-1">파트</label>
                <select {...infoForm.register('part')} className="input">
                  {PARTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary flex-1">저장</button>
                <button type="button" onClick={() => setEditMode(false)} className="btn-ghost flex-1">취소</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* 출석 기록 탭 */}
      {tab === 'attendance' && (
        <div className="space-y-3">
          {attendanceHistory.length > 0 && (
            <div className="card flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-600">출석률</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 bg-primary-100 rounded-full h-2">
                    <div className="bg-primary-400 h-2 rounded-full" style={{ width: `${rate}%` }} />
                  </div>
                  <span className="text-sm font-bold text-primary-500">{checkedCount}/{attendanceHistory.length} ({rate}%)</span>
                </div>
              </div>
            </div>
          )}
          {attendanceHistory.length === 0 ? (
            <div className="card text-center text-gray-400 py-8">출석 기록이 없습니다</div>
          ) : (
            attendanceHistory.map(r => (
              <div key={r.id} className="card flex items-center gap-3">
                {r.checked
                  ? <CheckCircle2 size={20} className="text-primary-400 flex-shrink-0" />
                  : <XCircle size={20} className="text-gray-300 flex-shrink-0" />
                }
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">{r.events?.title}</p>
                  <p className="text-xs text-gray-400">
                    {r.events?.date && format(parseISO(r.events.date), 'M월 d일 (eee)', { locale: ko })}
                    {r.events?.type ? ` · ${EVENT_TYPE_LABELS[r.events.type as keyof typeof EVENT_TYPE_LABELS]}` : ''}
                  </p>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${
                  r.checked ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'
                }`}>
                  {r.checked ? '출석' : '결석'}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* 비밀번호 변경 탭 */}
      {tab === 'password' && (
        <div className="card">
          <form onSubmit={pwForm.handleSubmit(onChangePw)} className="space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">새 비밀번호</label>
              <input {...pwForm.register('next', { required: true })} type="password" placeholder="6자 이상" className="input" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">새 비밀번호 확인</label>
              <input {...pwForm.register('confirm', { required: true })} type="password" placeholder="••••••••" className="input" />
            </div>
            <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
              <KeyRound size={16} /> 비밀번호 변경
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
