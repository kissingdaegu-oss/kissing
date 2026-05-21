import { useEffect, useState } from 'react'
import { CheckCircle2, XCircle, BarChart2 } from 'lucide-react'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import { KissingEvent, AttendanceRecord, Profile, EVENT_TYPE_LABELS, PART_LABELS } from '../types'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function Attendance() {
  const { user, isAdmin } = useAuth()
  const [events, setEvents] = useState<KissingEvent[]>([])
  const [selectedEvent, setSelectedEvent] = useState<KissingEvent | null>(null)
  const [members, setMembers] = useState<Profile[]>([])
  const [records, setRecords] = useState<AttendanceRecord[]>([])

  useEffect(() => {
    supabase.from('events').select('*').order('date', { ascending: false }).limit(20)
      .then(({ data }) => setEvents(data ?? []))
    supabase.from('profiles').select('*').order('created_at')
      .then(({ data }) => setMembers(data ?? []))
  }, [])

  const loadRecords = async (event: KissingEvent) => {
    setSelectedEvent(event)
    const { data } = await supabase
      .from('attendance')
      .select('*')
      .eq('event_id', event.id)
    setRecords(data ?? [])
  }

  const isChecked = (userId: string) => records.find(r => r.user_id === userId)?.checked ?? false

  const toggleAttendance = async (userId: string) => {
    if (!isAdmin) return
    const existing = records.find(r => r.user_id === userId)
    if (existing) {
      await supabase.from('attendance').update({ checked: !existing.checked }).eq('id', existing.id)
    } else {
      await supabase.from('attendance').insert({
        event_id: selectedEvent!.id,
        user_id: userId,
        checked: true,
      })
    }
    await loadRecords(selectedEvent!)
  }

  const checkedCount = members.filter(m => isChecked(m.id)).length
  const rate = members.length > 0 ? Math.round((checkedCount / members.length) * 100) : 0

  const myChecked = user ? isChecked(user.id) : false

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <h2 className="font-extrabold text-gray-700 text-lg">출석 관리</h2>

      {/* Event selector */}
      <div className="card space-y-2">
        <p className="text-sm font-semibold text-gray-600">일정 선택</p>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {events.length === 0 && <p className="text-sm text-gray-400">일정이 없습니다</p>}
          {events.map(event => (
            <button
              key={event.id}
              onClick={() => loadRecords(event)}
              className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition-colors ${
                selectedEvent?.id === event.id
                  ? 'bg-primary-400 text-white font-semibold'
                  : 'hover:bg-primary-50 text-gray-700'
              }`}
            >
              <span className="font-semibold">{event.title}</span>
              <span className="ml-2 opacity-70">
                {format(parseISO(event.date), 'M/d (eee)', { locale: ko })} · {EVENT_TYPE_LABELS[event.type]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {selectedEvent && (
        <>
          {/* Stats */}
          <div className="card flex items-center gap-4">
            <BarChart2 size={24} className="text-primary-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-gray-700 text-sm">{selectedEvent.title} 출석 현황</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-primary-100 rounded-full h-2">
                  <div
                    className="bg-primary-400 h-2 rounded-full transition-all"
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-primary-500">{checkedCount}/{members.length} ({rate}%)</span>
              </div>
            </div>
          </div>

          {/* My attendance (non-admin) */}
          {!isAdmin && (
            <div className={`card flex items-center gap-3 ${myChecked ? 'border-primary-300' : 'border-gray-200'}`}>
              {myChecked
                ? <CheckCircle2 size={22} className="text-primary-400 flex-shrink-0" />
                : <XCircle size={22} className="text-gray-300 flex-shrink-0" />
              }
              <p className="text-sm font-semibold text-gray-700">
                내 출석: {myChecked ? '출석' : '미출석'}
              </p>
            </div>
          )}

          {/* Member list (admin only) */}
          {isAdmin && (
            <div className="space-y-2">
              {members.map(member => {
                const checked = isChecked(member.id)
                return (
                  <button
                    key={member.id}
                    onClick={() => toggleAttendance(member.id)}
                    className={`w-full card flex items-center gap-3 transition-colors text-left ${
                      checked ? 'border-primary-300 bg-primary-50' : ''
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                      checked ? 'bg-primary-400 text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                      {member.name[0]}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-sm text-gray-800">{member.name}</p>
                      <p className="text-xs text-gray-400">{PART_LABELS[member.part]}</p>
                    </div>
                    {checked
                      ? <CheckCircle2 size={20} className="text-primary-400 flex-shrink-0" />
                      : <XCircle size={20} className="text-gray-300 flex-shrink-0" />
                    }
                  </button>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
