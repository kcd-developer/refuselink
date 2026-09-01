'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { getCustomerViewContext, type CustomerViewContext } from '@/lib/customer-view'
import { getSession, getSessionUser } from '@/lib/session'

const communityAnnouncementSchema = z.object({
  communityId: z.string().min(1),
  title: z.string().trim().min(1, 'Title is required').max(200),
  content: z.string().trim().max(5000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().nullable(),
  intent: z.enum(['draft', 'publish']).default('publish'),
}).superRefine((data, context) => {
  if (data.intent === 'publish' && !data.content) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['content'], message: 'Message is required to publish' })
  }
})

function viewCoversCommunity(context: CustomerViewContext, communityId: string) {
  if (context.active.mode === 'resident') return false
  if (context.active.mode === 'board') return context.options.some((option) => option.mode === 'board' && option.communityId === communityId)
  return context.active.allCommunities || context.active.communityId === communityId
}

async function customerAuthorization(companySlug: string, communityId: string) {
  const user = getSessionUser(await getSession())
  if (!user || user.userType !== 'customer' || user.companySlug !== companySlug || !user.companyId) return null
  const context = await getCustomerViewContext({ userId: user.id, companyId: user.companyId, companySlug })
  if (!viewCoversCommunity(context, communityId)) return null

  const membershipRole: 'board_member' | 'community_manager' = context.active.mode === 'board' ? 'board_member' : 'community_manager'
  const membership = await prisma.communityMembership.findFirst({
    where: {
      communityId,
      customerUserId: user.id,
      role: membershipRole,
      isActive: true,
      community: { companyId: user.companyId },
    },
    select: { id: true },
  })
  return membership ? { user, role: membershipRole } : null
}

export async function createCommunityAnnouncement(companySlug: string, input: unknown) {
  const parsed = communityAnnouncementSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid announcement' }
  const data = parsed.data
  const authorization = await customerAuthorization(companySlug, data.communityId)
  if (!authorization) return { error: 'You cannot create announcements for this community' }
  if (authorization.role !== 'board_member') return { error: 'Only board members can create community announcements' }

  const announcement = await prisma.communityAnnouncement.create({
    data: {
      companyId: authorization.user.companyId!,
      communityId: data.communityId,
      title: data.title,
      content: data.content,
      priority: data.priority,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      isPublished: data.intent === 'publish',
      createdById: authorization.user.id,
      createdByRole: authorization.role,
    },
  })
  await createAuditLog({
    companyId: authorization.user.companyId,
    actorId: authorization.user.id,
    actorType: 'customer',
    actorName: authorization.user.name,
    action: data.intent === 'publish' ? 'publish' : 'create_draft',
    entityType: 'community_announcement',
    entityId: announcement.id,
    metadata: { communityId: data.communityId, role: authorization.role },
  })
  revalidatePath(`/${companySlug}/my/announcements`)
  revalidatePath(`/${companySlug}/my`)
  revalidatePath(`/${companySlug}/announcements`)
  return { success: true }
}

export async function updateCommunityAnnouncement(companySlug: string, announcementId: string, input: unknown) {
  const parsed = communityAnnouncementSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid announcement' }
  const existing = await prisma.communityAnnouncement.findFirst({ where: { id: announcementId }, select: { communityId: true } })
  if (!existing || existing.communityId !== parsed.data.communityId) return { error: 'Announcement not found' }
  const authorization = await customerAuthorization(companySlug, existing.communityId)
  if (!authorization) return { error: 'You cannot edit announcements for this community' }

  await prisma.communityAnnouncement.update({
    where: { id: announcementId, companyId: authorization.user.companyId! },
    data: {
      title: parsed.data.title,
      content: parsed.data.content,
      priority: parsed.data.priority,
      startDate: new Date(parsed.data.startDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      isPublished: parsed.data.intent === 'publish',
    },
  })
  await createAuditLog({
    companyId: authorization.user.companyId,
    actorId: authorization.user.id,
    actorType: 'customer',
    actorName: authorization.user.name,
    action: parsed.data.intent === 'publish' ? 'publish' : 'update_draft',
    entityType: 'community_announcement',
    entityId: announcementId,
    metadata: { communityId: existing.communityId, role: authorization.role },
  })
  revalidatePath(`/${companySlug}/my/announcements`)
  revalidatePath(`/${companySlug}/my`)
  revalidatePath(`/${companySlug}/announcements`)
  return { success: true }
}

export async function deleteCommunityAnnouncement(companySlug: string, announcementId: string) {
  const existing = await prisma.communityAnnouncement.findFirst({ where: { id: announcementId }, select: { communityId: true } })
  if (!existing) return { error: 'Announcement not found' }
  const authorization = await customerAuthorization(companySlug, existing.communityId)
  if (!authorization) return { error: 'You cannot delete announcements for this community' }

  await prisma.communityAnnouncement.delete({ where: { id: announcementId, companyId: authorization.user.companyId! } })
  await createAuditLog({
    companyId: authorization.user.companyId,
    actorId: authorization.user.id,
    actorType: 'customer',
    actorName: authorization.user.name,
    action: 'delete',
    entityType: 'community_announcement',
    entityId: announcementId,
    metadata: { communityId: existing.communityId, role: authorization.role },
  })
  revalidatePath(`/${companySlug}/my/announcements`)
  revalidatePath(`/${companySlug}/my`)
  revalidatePath(`/${companySlug}/announcements`)
  return { success: true }
}

export async function moderateCommunityAnnouncement(companySlug: string, announcementId: string, action: 'publish' | 'unpublish' | 'delete') {
  const user = getSessionUser(await getSession())
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug || !user.companyId) return { error: 'Unauthorized' }
  if (!['company_owner', 'company_admin', 'company_manager'].includes(user.role ?? '')) return { error: 'Insufficient permissions' }

  const existing = await prisma.communityAnnouncement.findFirst({
    where: { id: announcementId, companyId: user.companyId },
    select: { id: true, communityId: true },
  })
  if (!existing) return { error: 'Announcement not found' }

  if (action === 'delete') await prisma.communityAnnouncement.delete({ where: { id: announcementId } })
  else await prisma.communityAnnouncement.update({ where: { id: announcementId }, data: { isPublished: action === 'publish' } })

  await createAuditLog({
    companyId: user.companyId,
    actorId: user.id,
    actorType: 'employee',
    actorName: user.name,
    action,
    entityType: 'community_announcement',
    entityId: announcementId,
    metadata: { communityId: existing.communityId },
  })
  revalidatePath(`/${companySlug}/my/announcements`)
  revalidatePath(`/${companySlug}/my`)
  revalidatePath(`/${companySlug}/announcements`)
  return { success: true }
}
