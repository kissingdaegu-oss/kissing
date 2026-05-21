import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'

interface LoginForm {
  email: string
  password: string
}

export default function Login() {
  const { user } = useAuth()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  if (user) return <Navigate to="/" replace />

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })
    if (error) setError('이메일 또는 비밀번호가 올바르지 않습니다.')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-blush flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-2">🎵</div>
          <h1 className="text-3xl font-extrabold text-primary-500">키씽대구</h1>
          <p className="text-gray-400 text-sm mt-1">Kissing Daegu</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-bold text-gray-700 mb-5">로그인</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                {...register('password', { required: true })}
                type="password"
                placeholder="••••••••"
                className="input"
              />
              {errors.password && <p className="text-rose-400 text-xs mt-1">비밀번호를 입력해 주세요.</p>}
            </div>

            {error && (
              <div className="bg-rose-50 text-rose-500 text-sm rounded-xl px-4 py-2.5">{error}</div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            아직 계정이 없으신가요?{' '}
            <Link to="/register" className="text-primary-500 font-semibold hover:underline">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
