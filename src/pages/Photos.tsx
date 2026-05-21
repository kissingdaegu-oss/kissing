import { useEffect, useState, useRef } from 'react'
import { Upload, Trash2, X, Image } from 'lucide-react'
import { supabase } from '../supabase'
import { useAuth } from '../contexts/AuthContext'
import { Photo } from '../types'
import { format, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'

export default function Photos() {
  const { user, profile, isAdmin } = useAuth()
  const [photos, setPhotos] = useState<Photo[]>([])
  const [selected, setSelected] = useState<Photo | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [caption, setCaption] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    const { data } = await supabase
      .from('photos')
      .select('*')
      .order('created_at', { ascending: false })
    setPhotos(data ?? [])
  }

  useEffect(() => { load() }, [])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${user!.id}/${Date.now()}.${ext}`

    const { error: uploadError } = await supabase.storage.from('photos').upload(path, file)
    if (uploadError) { setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path)

    await supabase.from('photos').insert({
      url: publicUrl,
      caption,
      uploaded_by: user!.id,
      uploader_name: profile!.name,
    })

    setShowUpload(false)
    setFile(null)
    setPreview(null)
    setCaption('')
    load()
    setUploading(false)
  }

  const handleDelete = async (photo: Photo) => {
    if (!confirm('사진을 삭제할까요?')) return
    const path = new URL(photo.url).pathname.split('/photos/')[1]
    await supabase.storage.from('photos').remove([path])
    await supabase.from('photos').delete().eq('id', photo.id)
    setSelected(null)
    load()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-extrabold text-gray-700 text-lg">사진첩</h2>
        {isAdmin && (
          <button
            onClick={() => { setShowUpload(true); setFile(null); setPreview(null); setCaption('') }}
            className="btn-primary flex items-center gap-1.5 text-sm"
          >
            <Upload size={16} /> 사진 올리기
          </button>
        )}
      </div>

      {photos.length === 0 ? (
        <div className="card text-center text-gray-400 py-12">
          <Image size={36} className="mx-auto mb-2 opacity-30" />
          <p>아직 사진이 없습니다 📷</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map(photo => (
            <button
              key={photo.id}
              onClick={() => setSelected(photo)}
              className="aspect-square rounded-xl overflow-hidden bg-primary-50 hover:opacity-90 transition-opacity"
            >
              <img src={photo.url} alt={photo.caption} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* 사진 상세 모달 */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setSelected(null)} />
          <div className="relative z-10 w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-xl">
            <img src={selected.url} alt={selected.caption} className="w-full object-cover max-h-80" />
            <div className="p-4">
              {selected.caption && <p className="font-semibold text-gray-800 mb-1">{selected.caption}</p>}
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  <span>{selected.uploader_name}</span>
                  <span className="mx-1">·</span>
                  <span>{format(parseISO(selected.created_at), 'yyyy.MM.dd', { locale: ko })}</span>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(selected)}
                    className="p-2 rounded-xl hover:bg-rose-100 text-rose-400"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 bg-black/40 text-white rounded-full p-1.5"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* 업로드 모달 */}
      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowUpload(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-700">사진 올리기</h3>
              <button onClick={() => setShowUpload(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-colors mb-3
                ${preview ? 'border-primary-300' : 'border-primary-200 hover:border-primary-400 p-8 text-center'}`}
            >
              {preview ? (
                <img src={preview} alt="preview" className="w-full object-cover max-h-48" />
              ) : (
                <>
                  <Image size={32} className="mx-auto text-primary-300 mb-2" />
                  <p className="text-sm text-gray-400">클릭해서 사진 선택</p>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

            <input
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="사진 설명 (선택)"
              className="input mb-3"
            />

            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="btn-primary w-full"
            >
              {uploading ? '업로드 중...' : '올리기'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
