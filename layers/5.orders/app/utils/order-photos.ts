export const ORDER_PHOTOS_BUCKET = 'ordem-fotos' as const

export const ORDER_PHOTOS_ACCEPT = 'image/jpeg,image/png,image/webp' as const

export const ORDER_PHOTOS_ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp'
])

export const ORDER_PHOTOS_MAX_BYTES = 5 * 1024 * 1024
export const ORDER_PHOTOS_MAX_COUNT = 20

export function orderPhotoStoragePath(orderId: string, file: File): string {
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg'
  return `${orderId}/${crypto.randomUUID()}.${ext}`
}

export function isAllowedOrderPhoto(file: File): boolean {
  return ORDER_PHOTOS_ALLOWED_TYPES.has(file.type) && file.size > 0 && file.size <= ORDER_PHOTOS_MAX_BYTES
}
