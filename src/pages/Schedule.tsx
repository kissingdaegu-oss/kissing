import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, X } from 'lucide-react'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import { KissingEvent, EventType, EVENT_TYPE_LABELS } from '../types'
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  addMonths, subMonths, eachDayOfInterval, isSameMonth, isSameDay, parseISO, isToday,
} from 'date-fns'
import { ko } from 'date-fns/locale'
import { useForm } from 'react-hook-form'

const TYPE_COLORS: Record<EventType, string> = {
  rehearsal: 'bg-secondary-400',
  performance: 'bg-rose-400',
  meeting: 'bg-sky-400',
}

const TYPE_BADGE: Record<EventType, string> = {
  rehearsal: 'bg-secondary-100 text-secondary-700',
  performance: 'bg-rose-100 text-rose-600',
  meeting: 'bg-sky-100 text-sky-600',
}

interface EventForm {
  title: string
  type: EventType
  date: string
  time: string
  location: string
  description: string
}

export default function Schedule() {
  const { user, isAdmin } = useAuth()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [events, setEvents] = useState<KissingEvent[]>([])
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<KissingEvent | null>(null)
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<EventForm>()

  const loadEvents = async () => {
    const start = format(startOfMonth(currentMonth), 'yyyy-MM-dd')
    const end = format(endOfMonth(currentMonth), 'yyyy-MM-dd')
    const { data } = await supabase
      .from('events')
      .select('*')
      .gte('date', start)
      .lte('date', end)
      .order('date').order('time')
    setEvents(data ?? [])
  }

  useEffect(() => { loadEvents() }, [currentMonth])

  const eventsForDay = (day: Date) =>
    events.filter(e => isSameDay(parseISO(e.date), day))

  const dayEvents = selectedDay ? eventsForDay(selectedDay) : []

  const openCreate = () => {
    setEditingEvent(null)
    reset({ date: selectedDay ? format(selectedDay, 'yyyy-MM-dd') : '', type: 'rehearsal' })
    setShowModal(true)
  }

  const openEdit = (event: KissingEvent) => {
    setEditingEvent(event)
    setValue('title', event.title)
    setValue('type', event.type)
    setValue('date', event.date)
    setValue('time', event.time)
    setValue('location', event.location)
    setValue('description', event.description)
    setShowModal(true)
  }

  const onSubmit = async (data: EventForm) => {
    if (editingEvent) {
      await supabase.from('events').update(data).eq('id', editingEvent.id)
    } else {
      await supabase.from('events').insert({ ...data, created_by: user!.id })
    }
    setShowModal(false)
    loadEvents()
  }

  const deleteEvent = async (id: string) => {
    if (!confirm('일정을 삭제할까요?')) return
    await supabase.from('events').delete().eq('id', id)
    loadEvents()
  }

  const calendarDays = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 0 }),
    end: endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 0 }),
  })

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-primary-100 text-primary-400">
            <ChevronLeft size={20} />
          </button>
          <h2 className="font-extrabold text-gray-700 text-lg w-28 text-center">
            {format(currentMonth, 'yyyy년 M월', { locale: ko })}
          </h2>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-1.5 rounded-lg hover:bg-primary-100 text-primary-400">
            <ChevronRight size={20} />
          </button>
        </div>
        {isAdmin && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-1.5 text-sm">
            <Plus size={16} /> 일정 추가
          </button>
        )}
      </div>

      {/* Calendar */}
      <div className="card p-3">
        <div className="grid grid-cols-7 mb-1">
          {['일', '월', '화', '수', '목', '금', '토'].map(d => (
            <div key={d} className={`text-center text-xs font-bold py-1
              ${d === '일' ? 'text-rose-400' : d === '토' ? 'text-sky-400' : 'text-gray-400'}`}>
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {calendarDays.map(day => {
            const dayEvts = eventsForDay(day)
            const isSelected = selectedDay && isSameDay(day, selectedDay)
            const isCurrentMonth = isSameMonth(day, currentMonth)
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDay(isSameDay(day, selectedDay ?? new Date('invalid')) ? null : day)}
                className={`flex flex-col items-center py-1 px-0.5 rounded-xl transition-colors
                  ${isSelected ? 'bg-primary-400' : isToday(day) ? 'bg-primary-100' : 'hover:bg-primary-50'}
                  ${!isCurrentMonth ? 'opacity-30' : ''}`}
              >
                <span className={`text-sm font-semibold
                  ${isSelected ? 'text-white' : isToday(day) ? 'text-primary-600' : 'text-gray-700'}`}>
                  {format(day, 'd')}
                </span>
                <div className="flex gap-0.5 mt-0.5 flex-wrap justify-center">
                  {dayEvts.slice(0, 3).map(e => (
                    <span key={e.id} className={`w-1.5 h-1.5 rounded-full ${TYPE_COLORS[e.type]}`} />
                  ))}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-500 px-1">
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary-400" />연습</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400" />공연</span>
        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-400" />회의</span>
      </div>

      {/* Events for selected day */}
      {selectedDay && (
        <div>
          <h3 className="font-bold text-gray-600 text-sm mb-2">
            {format(selectedDay, 'M월 d일 (eee)', { locale: ko })} 일정
          </h3>
          {dayEvents.length === 0 ? (
            <div className="card text-center text-gray-400 py-6 text-sm">이 날 일정이 없습니다</div>
          ) : (
            <div className="space-y-2">
              {dayEvents.map(event => (
                <div key={event.id} className="card flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-800 text-sm">{event.title}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${TYPE_BADGE[event.type]}`}>
                        {EVENT_TYPE_LABELS[event.type]}
                      </span>
                    </div>
                    {event.time && <p className="text-xs text-gray-400 mt-0.5">🕐 {event.time}</p>}
                    {event.location && <p className="text-xs text-gray-400">📍 {event.location}</p>}
                    {event.description && <p className="text-xs text-gray-500 mt-1">{event.description}</p>}
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(event)}
                        className="p-1.5 rounded-lg hover:bg-secondary-100 text-secondary-400">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => deleteEvent(event.id)}
                        className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-700">{editingEvent ? '일정 수정' : '일정 추가'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <input {...register('title', { required: true })} placeholder="제목" className="input" />
              <div className="grid grid-cols-2 gap-3">
                <select {...register('type')} className="input">
                  <option value="rehearsal">연습</option>
                  <option value="performance">공연</option>
                  <option value="meeting">회의</option>
                </select>
                <input {...register('date', { required: true })} type="date" className="input" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input {...register('time')} type="time" className="input" />
                <input {...register('location')} placeholder="장소" className="input" />
              </div>
              <textarea {...register('description')} placeholder="메모 (선택)" className="input h-20 resize-none" />
              <button type="submit" className="btn-primary w-full">
                {editingEvent ? '수정하기' : '추가하기'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
