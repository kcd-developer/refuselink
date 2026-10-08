export const MAX_TICKET_PHOTOS = 5
export const MAX_TICKET_PHOTO_BYTES = 10 * 1024 * 1024
export const TICKET_PHOTO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const

export function isTicketPhotoType(value: string): value is (typeof TICKET_PHOTO_TYPES)[number] {
  return TICKET_PHOTO_TYPES.includes(value as (typeof TICKET_PHOTO_TYPES)[number])
}
