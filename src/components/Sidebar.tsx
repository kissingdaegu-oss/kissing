import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CalendarDays, Users, ImageIcon, ClipboardCheck, LogOut, UserCircle } from 'lucide-react'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import { PART_LABELS } from '../types'

const navItems = [
  { to: '/',           label: '홈',     icon: LayoutDashboard },
  { to: '/schedule',   label: '일정',   icon: CalendarDays },
  { to: '/members',    label: '회원',   icon: Users },
  { to: '/photos',     label: '사진첩', icon: ImageIcon },
  { to: '/attendance', label: '출석',   icon: ClipboardCheck },
  { to: '/profile',    label: '프로필', icon: UserCircle },
]

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { profile } = useAuth()

  const handleLogout = async () => {
    await supabase.auth.signOut()
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-primary-100 w-64">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-primary-100">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎵</span>
          <div>
            <p className="font-extrabold text-primary-500 text-lg leading-tight">키씽대구</p>
            <p className="text-xs text-gray-400">Kissing Daegu</p>
          </div>
        </div>
      </div>

      {/* Profile chip */}
      {profile && (
        <div className="mx-4 mt-4 mb-2 bg-primary-50 rounded-xl px-4 py-3">
          <p className="font-bold text-gray-800 text-sm">{profile.name}</p>
          <p className="text-xs text-primary-500 mt-0.5">
            {PART_LABELS[profile.part]}
            {profile.role === 'admin' && (
              <span className="ml-1.5 bg-primary-400 text-white text-[10px] px-1.5 py-0.5 rounded-full">관리자</span>
            )}
          </p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors duration-150 ${
                isActive
                  ? 'bg-primary-400 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-primary-50 hover:text-primary-600'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-500 hover:bg-rose-50 hover:text-rose-400 transition-colors duration-150"
        >
          <LogOut size={18} />
          로그아웃
        </button>
      </div>
    </div>
  )
}
