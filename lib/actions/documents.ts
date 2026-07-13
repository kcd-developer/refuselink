'use server'

import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { createAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const documentSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional().nullable(),
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
  fileSize: z.number().min(0),
  mimeType: z.string().min(1),
  isPublished: z.boolean().default(true),
  targetAll: z.boolean().default(true),
  targetTypes: z.array(z.enum(['residential', 'commercial', 'roll_off'])).default([]),
  targetCityIds: z.array(z.string()).default([]),
  targetCommunityIds: z.array(z.string()).default([]),
})

function hasPermission(role: string | undefined) {
  return ['company_owner', 'company_admin', 'company_manager'].includes(role ?? '')
}

export async function createDocument(companySlug: string, data: any) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) return { error: 'Unauthorized' }
  if (!hasPermission(user.role)) return { error: 'Insufficient permissions' }
  const parsed = documentSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  const d = parsed.data
  try {
    const doc = await prisma.document.create({
      data: {
        companyId: user.companyId!,
        title: d.title,
        description: d.description || null,
        fileName: d.fileName,
        fileUrl: d.fileUrl,
        fileSize: d.fileSize,
        mimeType: d.mimeType,
        isPublished: d.isPublished,
        targetAll: d.targetAll,
        targetTypes: d.targetTypes,
        targetCityIds: d.targetCityIds,
        targetCommunityIds: d.targetCommunityIds,
        createdById: user.id,
      },
    })
    await createAuditLog({ companyId: user.companyId, actorId: user.id, actorType: 'employee', actorName: user.name, action: 'upload', entityType: 'document', entityId: doc.id })
    revalidatePath(`/${companySlug}/documents`)
    return { success: true, document: doc }
  } catch { return { error: 'Failed to create document' } }
}

export async function updateDocument(companySlug: string, documentId: string, data: any) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) return { error: 'Unauthorized' }
  if (!hasPermission(user.role)) return { error: 'Insufficient permissions' }
  try {
    await prisma.document.update({
      where: { id: documentId, companyId: user.companyId! },
      data: {
        title: data.title,
        description: data.description || null,
        isPublished: data.isPublished ?? true,
        targetAll: data.targetAll ?? true,
        targetTypes: data.targetTypes ?? [],
        targetCityIds: data.targetCityIds ?? [],
        targetCommunityIds: data.targetCommunityIds ?? [],
      },
    })
    revalidatePath(`/${companySlug}/documents`)
    return { success: true }
  } catch { return { error: 'Failed to update document' } }
}

export async function deleteDocument(companySlug: string, documentId: string) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) return { error: 'Unauthorized' }
  if (!hasPermission(user.role)) return { error: 'Insufficient permissions' }
  try {
    await prisma.document.delete({ where: { id: documentId, companyId: user.companyId! } })
    revalidatePath(`/${companySlug}/documents`)
    return { success: true }
  } catch { return { error: 'Failed to delete document' } }
}
