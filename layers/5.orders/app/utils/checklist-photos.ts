export const CHECKLIST_PHOTOS_BUCKET = 'checklist-fotos'

export const CHECKLIST_PHOTOS_MAX_PER_ITEM = 3

export const CHECKLIST_PHOTOS_MAX_SIZE_BYTES = 5 * 1024 * 1024

export const CHECKLIST_PHOTOS_ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
] as const

export const CHECKLIST_PHOTOS_ACCEPT = 'image/jpeg,image/png,image/webp'
