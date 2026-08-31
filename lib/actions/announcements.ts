'use server'

import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { createAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const announcementSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  content: z.string().min(1, 'Content is required').max(5000),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().nullable(),
  isPublished: z.boolean().default(false),
  targetAll: z.boolean().default(true),
  targetTypes: z.array(z.enum(['residential', 'commercial', 'roll_off'])).default([]),
  targetCityIds: z.array(z.string()).default([]),
  targetCommunityIds: z.array(z.string()).default([]),
})

function hasPermission(role: string | undefined) {
  return ['company_owner', 'company_admin', 'company_manager'].includes(role ?? '')
}

export async function createAnnouncement(companySlug: string, data: any) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) return { error: 'Unauthorized' }
  if (!hasPermission(user.role)) return { error: 'Insufficient permissions' }
  const parsed = announcementSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  const d = parsed.data
  try {
    const ann = await prisma.announcement.create({
      data: {
        companyId: user.companyId!,
        title: d.title,
        content: d.content,
        priority: d.priority,
        startDate: new Date(d.startDate),
        endDate: d.endDate ? new Date(d.endDate) : null,
        isPublished: d.isPublished,
        targetAll: d.targetAll,
        targetTypes: d.targetTypes,
        targetCityIds: d.targetCityIds,
        targetCommunityIds: d.targetCommunityIds,
        createdById: user.id,
      },
    })
    if (d.isPublished) {
      await createAuditLog({ companyId: user.companyId, actorId: user.id, actorType: 'employee', actorName: user.name, action: 'publish', entityType: 'announcement', entityId: ann.id })
    }
    revalidatePath(`/${companySlug}/announcements`)
    revalidatePath(`/${companySlug}/my/announcements`)
    revalidatePath(`/${companySlug}/my`)
    return { success: true, announcement: ann }
  } catch { return { error: 'Failed to create announcement' } }
}

export async function updateAnnouncement(companySlug: string, announcementId: string, data: any) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) return { error: 'Unauthorized' }
  if (!hasPermission(user.role)) return { error: 'Insufficient permissions' }
  const parsed = announcementSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  const d = parsed.data
  try {
    await prisma.announcement.update({
      where: { id: announcementId, companyId: user.companyId! },
      data: {
        title: d.title,
        content: d.content,
        priority: d.priority,
        startDate: new Date(d.startDate),
        endDate: d.endDate ? new Date(d.endDate) : null,
        isPublished: d.isPublished,
        targetAll: d.targetAll,
        targetTypes: d.targetTypes,
        targetCityIds: d.targetCityIds,
        targetCommunityIds: d.targetCommunityIds,
      },
    })
    revalidatePath(`/${companySlug}/announcements`)
    revalidatePath(`/${companySlug}/my/announcements`)
    revalidatePath(`/${companySlug}/my`)
    return { success: true }
  } catch { return { error: 'Failed to update announcement' } }
}

export async function deleteAnnouncement(companySlug: string, announcementId: string) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) return { error: 'Unauthorized' }
  if (!hasPermission(user.role)) return { error: 'Insufficient permissions' }
  try {
    await prisma.announcement.delete({ where: { id: announcementId, companyId: user.companyId! } })
    revalidatePath(`/${companySlug}/announcements`)
    revalidatePath(`/${companySlug}/my/announcements`)
    revalidatePath(`/${companySlug}/my`)
    return { success: true }
  } catch { return { error: 'Failed to delete announcement' } }
}
