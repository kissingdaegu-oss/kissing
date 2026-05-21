import { useEffect, useState, useRef } from 'react'
import { Upload, Download, Trash2, Music, FileText, File, X } from 'lucide-react'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import { LibraryItem, LibraryItemType, LIBRARY_TYPE_LABELS } from '../types'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { useForm } from 'react-hook-form'

const TYPE_ICONS = {
  score: <FileText size={20} className="text-secondary-400" />,
  audio: <Music size={20} className="text-primary-400" />,
  other: <File size={20} className="text-gray-400" />,
}

const TYPE_FILTER: (LibraryItemType | 'all')[] = ['all', 'score', 'audio', 'other']
const TYPE_FILTER_LABELS: Record<LibraryItemType | 'all', string> = { all: '전체', ...LIBRARY_TYPE_LABELS }

interface UploadForm { title: string; type: LibraryItemType; description: string }

export default function Library() {
  const { user, profile, isAdmin } = useAuth()
  const [items, setItems] = useState<LibraryItem[]>([])
  const [filterType, setFilterType] = useState<LibraryItemType | 'all'>('all')
  const [showModal, setShowModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { register, handleSubmit, reset } = useForm<UploadForm>()

  const loadItems = async () => {
    const { data } = await supabase.from('library').select('*').order('created_at', { ascending: false })
    setItems(data ?? [])
  }

  useEffect(() => { loadItems() }, [])

  const filtered = filterType === 'all' ? items : items.filter(i => i.type === filterType)

  const onSubmit = async (data: UploadForm) => {
    if (!selectedFile) return
    setUploading(true)
    const ext = selectedFile.name.split('.').pop()
    const path = `${user!.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('library')
      .upload(path, selectedFile)

    if (uploadError) { setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('library').getPublicUrl(path)

    await supabase.from('library').insert({
      ...data,
      file_url: publicUrl,
      file_name: selectedFile.name,
      uploaded_by: user!.id,
      uploader_name: profile!.name,
    })

    setShowModal(false)
    setSelectedFile(null)
    reset()
    loadItems()
    setUploading(false)
  }

  const deleteItem = async (item: LibraryItem) => {
    if (!confirm('파일을 삭제할까요?')) return
    const path = new URL(item.file_url).pathname.split('/library/')[1]
    await supabase.storage.from('library').remove([path])
    await supabase.from('library').delete().eq('id', item.id)
    loadItems()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-extrabold text-gray-700 text-lg">자료실</h2>
        {isAdmin && (
          <button onClick={() => { reset(); setSelectedFile(null); setShowModal(true) }}
            className="btn-primary flex items-center gap-1.5 text-sm">
            <Upload size={16} /> 업로드
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-1.5 flex-wrap">
        {TYPE_FILTER.map(t => (
          <button key={t} onClick={() => setFilterType(t)}
            className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${
              filterType === t
                ? 'bg-primary-400 text-white'
                : 'bg-white text-gray-500 border border-primary-100 hover:bg-primary-50'
            }`}>
            {TYPE_FILTER_LABELS[t]}
          </button>
        ))}
      </div>

      {/* File list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="card text-center text-gray-400 py-8">자료가 없습니다 🎵</div>
        )}
        {filtered.map(item => (
          <div key={item.id} className="card flex items-center gap-3">
            <div className="flex-shrink-0">{TYPE_ICONS[item.type]}</div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-800 text-sm truncate">{item.title}</p>
              <p className="text-xs text-gray-400 truncate">{item.file_name}</p>
              <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
                <span>{item.uploader_name}</span>
                <span>·</span>
                <span>{format(parseISO(item.created_at), 'yy.MM.dd', { locale: ko })}</span>
              </div>
              {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <a href={item.file_url} target="_blank" rel="noreferrer" download
                className="p-2 rounded-xl hover:bg-primary-100 text-primary-400">
                <Download size={16} />
              </a>
              {isAdmin && (
                <button onClick={() => deleteItem(item)}
                  className="p-2 rounded-xl hover:bg-rose-100 text-rose-400">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Upload modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-700">파일 업로드</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <input {...register('title', { required: true })} placeholder="제목" className="input" />
              <select {...register('type')} className="input">
                <option value="score">악보</option>
                <option value="audio">음원</option>
                <option value="other">기타</option>
              </select>
              <textarea {...register('description')} placeholder="설명 (선택)" className="input h-16 resize-none" />

              {/* File picker */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-primary-200 rounded-xl p-4 text-center cursor-pointer hover:border-primary-400 transition-colors"
              >
                {selectedFile ? (
                  <p className="text-sm text-primary-600 font-semibold truncate">{selectedFile.name}</p>
                ) : (
                  <p className="text-sm text-gray-400">클릭해서 파일 선택</p>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={e => setSelectedFile(e.target.files?.[0] ?? null)}
              />

              <button type="submit" disabled={!selectedFile || uploading} className="btn-primary w-full">
                {uploading ? '업로드 중...' : '업로드'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
