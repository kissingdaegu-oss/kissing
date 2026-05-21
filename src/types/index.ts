export type Part =
  | 'soprano'
  | 'alto'
  | 'countertenor'
  | 'tenor'
  | 'baritone'
  | 'bass'
  | 'percussion'

export type Role = 'admin' | 'member'

export interface Profile {
  id: string
  name: string
  part: Part
  role: Role
  created_at: string
}

export type EventType = 'rehearsal' | 'performance' | 'meeting'

export interface KissingEvent {
  id: string
  title: string
  type: EventType
  date: string
  time: string
  location: string
  description: string
  created_by: string
  created_at: string
}

export interface AttendanceRecord {
  id: string
  event_id: string
  user_id: string
  checked: boolean
  updated_at: string
  profile?: Profile
}

export type LibraryItemType = 'score' | 'audio' | 'other'

export interface LibraryItem {
  id: string
  title: string
  type: LibraryItemType
  file_url: string
  file_name: string
  uploaded_by: string
  uploader_name: string
  description: string
  created_at: string
}

export const PART_LABELS: Record<Part, string> = {
  soprano: '소프라노',
  alto: '알토',
  countertenor: '카운터테너',
  tenor: '테너',
  baritone: '바리톤',
  bass: '베이스',
  percussion: '퍼커션',
}

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  rehearsal: '연습',
  performance: '공연',
  meeting: '회의',
}

export const LIBRARY_TYPE_LABELS: Record<LibraryItemType, string> = {
  score: '악보',
  audio: '음원',
  other: '기타',
}
