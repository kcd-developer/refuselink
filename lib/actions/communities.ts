'use server'

import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { createAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const communitySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  cityId: z.string().min(1, 'City is required'),
})

export async function createCommunity(companySlug: string, data: { name: string; cityId: string }) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) return { error: 'Unauthorized' }
  if (!['company_owner', 'company_admin', 'company_manager'].includes(user.role ?? '')) return { error: 'Insufficient permissions' }
  const parsed = communitySchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  // Verify city belongs to company
  const city = await prisma.city.findUnique({ where: { id: parsed.data.cityId, companyId: user.companyId! } })
  if (!city) return { error: 'City not found' }
  try {
    const community = await prisma.community.create({
      data: { companyId: user.companyId!, cityId: parsed.data.cityId, name: parsed.data.name },
    })
    await createAuditLog({ companyId: user.companyId, actorId: user.id, actorType: 'employee', actorName: user.name, action: 'create', entityType: 'community', entityId: community.id })
    revalidatePath(`/${companySlug}/communities`)
    return { success: true, community }
  } catch { return { error: 'Failed to create community' } }
}

export async function updateCommunity(companySlug: string, communityId: string, data: { name: string; cityId: string }) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) return { error: 'Unauthorized' }
  if (!['company_owner', 'company_admin', 'company_manager'].includes(user.role ?? '')) return { error: 'Insufficient permissions' }
  const parsed = communitySchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  try {
    await prisma.community.update({ where: { id: communityId, companyId: user.companyId! }, data: { name: parsed.data.name, cityId: parsed.data.cityId } })
    revalidatePath(`/${companySlug}/communities`)
    return { success: true }
  } catch { return { error: 'Failed to update community' } }
}

export async function deleteCommunity(companySlug: string, communityId: string) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) return { error: 'Unauthorized' }
  if (!['company_owner', 'company_admin'].includes(user.role ?? '')) return { error: 'Insufficient permissions' }
  try {
    const comm = await prisma.community.findUnique({ where: { id: communityId, companyId: user.companyId! }, include: { _count: { select: { customers: true } } } })
    if (!comm) return { error: 'Community not found' }
    if ((comm._count?.customers ?? 0) > 0) return { error: 'Cannot delete community with associated customers' }
    await prisma.community.delete({ where: { id: communityId } })
    revalidatePath(`/${companySlug}/communities`)
    return { success: true }
  } catch { return { error: 'Failed to delete community' } }
}
