import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import { Part, PART_LABELS } from '../types'

interface RegisterForm {
  name: string
  email: string
  password: string
  confirmPassword: string
  part: Part
}

const PARTS = Object.entries(PART_LABELS) as [Part, string][]

export default function Register() {
  const { user, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [registering, setRegistering] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<RegisterForm>()

  // 가입 진행 중엔 리다이렉트 막기
  if (user && !registering) return <Navigate to="/" replace />

  const onSubmit = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    setLoading(true)
    setRegistering(true)
    setError('')

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      setRegistering(false)
      return
    }

    if (!authData.user) {
      setError('이미 가입된 이메일입니다. 또는 Supabase 대시보드 → Authentication → Providers → Email에서 "Confirm email"을 꺼주세요.')
      setLoading(false)
      setRegistering(false)
      return
    }

    // 첫 번째 가입자는 admin
    const { count } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
    const role = (count ?? 0) === 0 ? 'admin' : 'member'

    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      name: data.name,
      part: data.part,
      role,
    })

    if (profileError) {
      console.error('Profile insert error:', profileError)
      setError(`프로필 생성에 실패했습니다: ${profileError.message}`)
      setLoading(false)
      setRegistering(false)
      return
    }

    // 프로필 삽입 완료 후 컨텍스트 갱신하고 이동
    await refreshProfile(authData.user.id)
    setRegistering(false)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-blush flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🎵</div>
          <h1 className="text-3xl font-extrabold text-primary-500">키씽대구</h1>
          <p className="text-gray-400 text-sm mt-1">Kissing Daegu</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-gray-700 mb-5">회원가입</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">이름</label>
              <input
                {...register('name', { required: true })}
                type="text"
                placeholder="홍길동"
                className="input"
              />
              {errors.name && <p className="text-rose-400 text-xs mt-1">이름을 입력해 주세요.</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">파트</label>
              <select {...register('part', { required: true })} className="input">
                <option value="">파트 선택</option>
                {PARTS.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              {errors.part && <p className="text-rose-400 text-xs mt-1">파트를 선택해 주세요.</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">이메일</label>
              <input
                {...register('email', { required: true })}
                type="email"
                placeholder="email@example.com"
                className="input"
              />
              {errors.email && <p className="text-rose-400 text-xs mt-1">이메일을 입력해 주세요.</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">비밀번호</label>
              <input
                {...register('password', { required: true, minLength: 6 })}
                type="password"
                placeholder="6자 이상"
                className="input"
              />
              {errors.password && <p className="text-rose-400 text-xs mt-1">비밀번호는 6자 이상이어야 합니다.</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-600 mb-1">비밀번호 확인</label>
              <input
                {...register('confirmPassword', { required: true })}
                type="password"
                placeholder="••••••••"
                className="input"
              />
            </div>

            {error && (
              <div className="bg-rose-50 text-rose-500 text-sm rounded-xl px-4 py-2.5">{error}</div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? '가입 중...' : '가입하기'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="text-primary-500 font-semibold hover:underline">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
