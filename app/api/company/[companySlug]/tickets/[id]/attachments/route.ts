export const dynamic = 'force-dynamic'

import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession, getSessionUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import { generatePrivateUploadUrl, getStoredFileMetadata } from '@/lib/supabase'
import { isTicketPhotoType, MAX_TICKET_PHOTOS, MAX_TICKET_PHOTO_BYTES } from '@/lib/ticket-attachment-constants'

const requestSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('presign'), messageId: z.string().min(1), fileName: z.string().trim().min(1).max(255), contentType: z.string().min(1), fileSize: z.number().int().positive() }),
  z.object({ action: z.literal('finalize'), messageId: z.string().min(1), storagePath: z.string().min(1), fileName: z.string().trim().min(1).max(255), contentType: z.string().min(1), fileSize: z.number().int().positive() }),
])

function safeExtension(fileName: string, contentType: string) {
  const byType: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heif' }
  return byType[contentType] ?? fileName.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? 'img'
}

export async function POST(req: Request, { params }: { params: Promise<{ companySlug: string; id: string }> }) {
  const { companySlug, id } = await params
  const user = getSessionUser(await getSession())
  if (!user || user.companySlug !== companySlug || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = requestSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid attachment request.' }, { status: 400 })
  const data = parsed.data
  if (!isTicketPhotoType(data.contentType)) return NextResponse.json({ error: 'Only JPEG, PNG, WebP, HEIC, and HEIF photos are supported.' }, { status: 400 })
  if (data.fileSize > MAX_TICKET_PHOTO_BYTES) return NextResponse.json({ error: 'Photos must be 10 MB or smaller.' }, { status: 400 })

  const ticket = await prisma.ticket.findFirst({
    where: { id, companyId: user.companyId },
    include: { customer: { select: { communityId: true, userAccess: { where: { customerUserId: user.id }, select: { id: true }, take: 1 } } } },
  })
  if (!ticket) return NextResponse.json({ error: 'Request not found.' }, { status: 404 })

  let authorized = user.userType === 'employee' && ticket.serviceRecipient === 'company'
  if (user.userType === 'customer') {
    authorized = ticket.customer.userAccess.length > 0
    if (!authorized && ticket.serviceRecipient === 'community_manager' && ticket.customer.communityId) {
      authorized = Boolean(await prisma.communityMembership.findFirst({ where: { communityId: ticket.customer.communityId, customerUserId: user.id, role: 'community_manager', isActive: true }, select: { id: true } }))
    }
  }
  if (!authorized) return NextResponse.json({ error: 'You do not have access to this request.' }, { status: 403 })

  const message = await prisma.ticketMessage.findFirst({ where: { id: data.messageId, ticketId: ticket.id, authorId: user.id }, include: { _count: { select: { attachments: true } } } })
  if (!message) return NextResponse.json({ error: 'Message not found.' }, { status: 404 })
  if (message._count.attachments >= MAX_TICKET_PHOTOS) return NextResponse.json({ error: `A message can have up to ${MAX_TICKET_PHOTOS} photos.` }, { status: 400 })

  const prefix = `ticket-attachments/${user.companyId}/${ticket.id}/${message.id}/`
  if (data.action === 'presign') {
    const storagePath = `${prefix}${randomUUID()}.${safeExtension(data.fileName, data.contentType)}`
    try {
      const upload = await generatePrivateUploadUrl(storagePath)
      return NextResponse.json({ ...upload, storagePath })
    } catch (error) {
      console.error('Failed to prepare ticket photo upload', error)
      return NextResponse.json({ error: 'Photo uploads are temporarily unavailable. Your request was saved; please try attaching the photo from the request page.' }, { status: 503 })
    }
  }

  if (!data.storagePath.startsWith(prefix) || data.storagePath.includes('..')) return NextResponse.json({ error: 'Invalid storage path.' }, { status: 400 })
  const existing = await prisma.ticketAttachment.findFirst({ where: { fileUrl: data.storagePath }, select: { id: true } })
  if (existing) return NextResponse.json(existing)

  let stored
  try {
    stored = await getStoredFileMetadata(data.storagePath)
  } catch (error) {
    console.error('Failed to verify ticket photo upload', error)
    return NextResponse.json({ error: 'The photo upload could not be verified. Please try again.' }, { status: 503 })
  }
  if (!stored) return NextResponse.json({ error: 'Uploaded photo could not be verified.' }, { status: 400 })
  const storedSize = Number(stored.metadata?.size ?? data.fileSize)
  const storedType = String(stored.metadata?.mimetype ?? data.contentType)
  if (storedSize > MAX_TICKET_PHOTO_BYTES || !isTicketPhotoType(storedType)) return NextResponse.json({ error: 'Uploaded photo failed validation.' }, { status: 400 })

  const attachment = await prisma.ticketAttachment.create({ data: { ticketMessageId: message.id, fileUrl: data.storagePath, fileName: data.fileName, fileSize: storedSize, mimeType: storedType } })
  return NextResponse.json(attachment)
}
