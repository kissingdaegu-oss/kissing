import { useEffect, useState } from 'react'
import { Plus, Minus, Star } from 'lucide-react'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import { Profile, Part, PART_LABELS } from '../types'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'

const ALL_PARTS: (Part | 'all')[] = ['all', 'soprano', 'alto', 'countertenor', 'tenor', 'baritone', 'bass', 'percussion']
const PART_FILTER_LABELS: Record<Part | 'all', string> = { all: '전체', ...PART_LABELS }

const PART_BADGE: Record<Part, string> = {
  soprano: 'badge-soprano',
  alto: 'badge-alto',
  countertenor: 'badge-countertenor',
  tenor: 'badge-tenor',
  baritone: 'badge-baritone',
  bass: 'badge-bass',
  percussion: 'badge-percussion',
}

export default function Members() {
  const { isAdmin, profile: myProfile } = useAuth()
  const [members, setMembers] = useState<Profile[]>([])
  const [filterPart, setFilterPart] = useState<Part | 'all'>('all')

  const loadMembers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true })
    setMembers(data ?? [])
  }

  useEffect(() => { loadMembers() }, [])

  const toggleRole = async (member: Profile) => {
    const newRole = member.role === 'admin' ? 'member' : 'admin'
    await supabase.from('profiles').update({ role: newRole }).eq('id', member.id)
    loadMembers()
  }

  const changePoints = async (member: Profile, delta: number) => {
    const newPoints = Math.max(0, (member.points ?? 0) + delta)
    await supabase.from('profiles').update({ points: newPoints }).eq('id', member.id)
    loadMembers()
  }

  const filtered = filterPart === 'all' ? members : members.filter(m => m.part === filterPart)

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-extrabold text-gray-700 text-lg">회원 목록</h2>
        <span className="text-sm text-gray-400">{filtered.length}명</span>
      </div>

      {/* Part filter */}
      <div className="flex gap-1.5 flex-wrap">
        {ALL_PARTS.map(part => (
          <button
            key={part}
            onClick={() => setFilterPart(part)}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
              filterPart === part
                ? 'bg-primary-400 text-white'
                : 'bg-white text-gray-500 border border-primary-100 hover:bg-primary-50'
            }`}
          >
            {PART_FILTER_LABELS[part]}
          </button>
        ))}
      </div>

      {/* Member cards */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="card text-center text-gray-400 py-8">해당 파트 회원이 없습니다</div>
        )}
        {filtered.map(member => (
          <div key={member.id} className="card flex items-center gap-4">
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-500 font-bold text-sm flex-shrink-0">
              {member.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-gray-800 text-sm">{member.name}</p>
                {member.id === myProfile?.id && (
                  <span className="text-[10px] bg-primary-100 text-primary-500 px-1.5 py-0.5 rounded-full font-semibold">나</span>
                )}
                {member.role === 'admin' && (
                  <span className="text-[10px] bg-primary-400 text-white px-1.5 py-0.5 rounded-full font-semibold">관리자</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${PART_BADGE[member.part]}`}>
                  {PART_LABELS[member.part]}
                </span>
                <span className="text-xs text-gray-400">
                  {format(parseISO(member.created_at), 'yyyy.MM.dd 가입', { locale: ko })}
                </span>
                <span className="flex items-center gap-0.5 text-xs text-yellow-600 font-semibold">
                  <Star size={11} className="fill-yellow-400 text-yellow-400" />
                  {member.points ?? 0}
                </span>
              </div>
            </div>
            {isAdmin && (
              <div className="flex items-center gap-1 flex-shrink-0">
                {/* 포인트 */}
                <button onClick={() => changePoints(member, -1)}
                  className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-rose-100 text-gray-500 hover:text-rose-400 flex items-center justify-center">
                  <Minus size={13} />
                </button>
                <button onClick={() => changePoints(member, 1)}
                  className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-primary-100 text-gray-500 hover:text-primary-500 flex items-center justify-center">
                  <Plus size={13} />
                </button>
                {/* 역할 */}
                {member.id !== myProfile?.id && (
                  <button
                    onClick={() => toggleRole(member)}
                    className="text-xs px-2.5 py-1.5 rounded-xl border border-primary-200 text-primary-500 hover:bg-primary-50 font-semibold ml-1"
                  >
                    {member.role === 'admin' ? '일반' : '관리자'}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
