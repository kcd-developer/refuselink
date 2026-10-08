import { MAX_TICKET_PHOTOS, MAX_TICKET_PHOTO_BYTES, TICKET_PHOTO_TYPES } from '@/lib/ticket-attachment-constants'

export const TICKET_PHOTO_ACCEPT = TICKET_PHOTO_TYPES.join(',')

export function getTicketPhotoContentType(file: File) {
  if ((TICKET_PHOTO_TYPES as readonly string[]).includes(file.type)) return file.type
  const extension = file.name.split('.').pop()?.toLowerCase()
  const byExtension: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', heic: 'image/heic', heif: 'image/heif' }
  return extension ? byExtension[extension] ?? '' : ''
}

export function validateTicketPhotos(files: File[]) {
  if (files.length > MAX_TICKET_PHOTOS) return `You can attach up to ${MAX_TICKET_PHOTOS} photos.`
  for (const file of files) {
    if (!getTicketPhotoContentType(file)) return `${file.name} is not a supported photo format.`
    if (file.size > MAX_TICKET_PHOTO_BYTES) return `${file.name} is larger than 10 MB.`
  }
  return null
}

export async function uploadTicketPhotos({
  companySlug,
  ticketId,
  messageId,
  files,
  onProgress,
}: {
  companySlug: string
  ticketId: string
  messageId: string
  files: File[]
  onProgress?: (current: number, total: number) => void
}) {
  const validationError = validateTicketPhotos(files)
  if (validationError) throw new Error(validationError)

  for (let index = 0; index < files.length; index += 1) {
    const file = files[index]
    const contentType = getTicketPhotoContentType(file)
    onProgress?.(index + 1, files.length)
    const endpoint = `/api/company/${companySlug}/tickets/${ticketId}/attachments`
    const presignResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'presign', messageId, fileName: file.name, contentType, fileSize: file.size }),
    })
    const presign = await presignResponse.json().catch(() => ({}))
    if (!presignResponse.ok) throw new Error(presign.error || `Could not prepare ${file.name} for upload.`)

    const uploadBody = new FormData()
    uploadBody.append('cacheControl', '3600')
    const uploadFile = file.type ? file : new File([file], file.name, { type: contentType, lastModified: file.lastModified })
    uploadBody.append('', uploadFile, uploadFile.name)
    const uploadResponse = await fetch(presign.uploadUrl, {
      method: 'PUT',
      headers: { 'x-upsert': 'false' },
      body: uploadBody,
    })
    if (!uploadResponse.ok) throw new Error(`Could not upload ${file.name}.`)

    const finalizeResponse = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'finalize',
        messageId,
        storagePath: presign.storagePath,
        fileName: file.name,
        contentType,
        fileSize: file.size,
      }),
    })
    const finalized = await finalizeResponse.json().catch(() => ({}))
    if (!finalizeResponse.ok) throw new Error(finalized.error || `Could not attach ${file.name} to the request.`)
  }
}
