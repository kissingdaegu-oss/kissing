import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, Users, Music } from 'lucide-react'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import { KissingEvent, EVENT_TYPE_LABELS, PART_LABELS } from '../types'
import { format, differenceInDays, parseISO, isAfter, startOfDay } from 'date-fns'
import { ko } from 'date-fns/locale'

const EVENT_COLORS = {
  rehearsal: 'bg-secondary-100 text-secondary-700 border-secondary-200',
  performance: 'bg-rose-100 text-rose-600 border-rose-200',
  meeting: 'bg-sky-100 text-sky-600 border-sky-200',
}

export default function Dashboard() {
  const { profile } = useAuth()
  const [upcomingEvents, setUpcomingEvents] = useState<KissingEvent[]>([])
  const [memberCount, setMemberCount] = useState(0)
  const [nextPerformance, setNextPerformance] = useState<KissingEvent | null>(null)

  useEffect(() => {
    const today = startOfDay(new Date()).toISOString().split('T')[0]

    supabase
      .from('events')
      .select('*')
      .gte('date', today)
      .order('date', { ascending: true })
      .order('time', { ascending: true })
      .limit(3)
      .then(({ data }) => setUpcomingEvents(data ?? []))

    supabase
      .from('events')
      .select('*')
      .eq('type', 'performance')
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(1)
      .then(({ data }) => setNextPerformance(data?.[0] ?? null))

    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .then(({ count }) => setMemberCount(count ?? 0))
  }, [])

  const dDay = nextPerformance
    ? differenceInDays(parseISO(nextPerformance.date), startOfDay(new Date()))
    : null

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Welcome */}
      <div className="card bg-gradient-to-br from-primary-400 to-secondary-400 text-white border-0">
        <div className="flex items-center gap-3">
          <div className="text-4xl">🎵</div>
          <div>
            <p className="font-bold text-lg leading-tight">
              안녕하세요, {profile?.name ?? ''}님!
            </p>
            <p className="text-primary-100 text-sm mt-0.5">
              {profile ? PART_LABELS[profile.part] : ''} 파트
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card text-center">
          <Users size={22} className="mx-auto text-secondary-400 mb-1" />
          <p className="text-2xl font-extrabold text-gray-800">{memberCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">전체 회원</p>
        </div>
        <div className="card text-center">
          <Music size={22} className="mx-auto text-rose-400 mb-1" />
          {dDay !== null ? (
            <>
              <p className="text-2xl font-extrabold text-rose-500">
                {dDay === 0 ? 'D-Day' : `D-${dDay}`}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 truncate px-1">{nextPerformance?.title}</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-extrabold text-gray-300">-</p>
              <p className="text-xs text-gray-400 mt-0.5">예정 공연 없음</p>
            </>
          )}
        </div>
      </div>

      {/* Upcoming events */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-extrabold text-gray-700 flex items-center gap-1.5">
            <CalendarDays size={18} className="text-primary-400" />
            다가오는 일정
          </h2>
          <Link to="/schedule" className="text-xs text-primary-500 font-semibold hover:underline">
            전체 보기 →
          </Link>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="card text-center text-gray-400 py-8">
            예정된 일정이 없습니다 🎶
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="card flex items-start gap-4">
                <div className="text-center min-w-[44px]">
                  <p className="text-xs text-gray-400 font-semibold">
                    {format(parseISO(event.date), 'M월', { locale: ko })}
                  </p>
                  <p className="text-2xl font-extrabold text-primary-500 leading-tight">
                    {format(parseISO(event.date), 'd')}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-bold text-gray-800 text-sm">{event.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${EVENT_COLORS[event.type]}`}>
                      {EVENT_TYPE_LABELS[event.type]}
                    </span>
                  </div>
                  {event.location && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">📍 {event.location}</p>
                  )}
                  {event.time && (
                    <p className="text-xs text-gray-400">🕐 {event.time}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
