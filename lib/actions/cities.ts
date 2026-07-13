'use server'

import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { createAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const citySchema = z.object({
  name: z.string().min(1, 'City name is required').max(100),
  state: z.string().min(1, 'State is required').max(50),
})

export async function createCity(companySlug: string, data: { name: string; state: string }) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) {
    return { error: 'Unauthorized' }
  }
  if (!['company_owner', 'company_admin', 'company_manager'].includes(user.role ?? '')) {
    return { error: 'Insufficient permissions' }
  }
  const parsed = citySchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }

  try {
    const city = await prisma.city.create({
      data: { companyId: user.companyId!, name: parsed.data.name, state: parsed.data.state },
    })
    await createAuditLog({ companyId: user.companyId, actorId: user.id, actorType: 'employee', actorName: user.name, action: 'create', entityType: 'city', entityId: city.id })
    revalidatePath(`/${companySlug}/cities`)
    return { success: true, city }
  } catch (e: any) {
    if (e?.code === 'P2002') return { error: 'This city already exists for your company' }
    return { error: 'Failed to create city' }
  }
}

export async function updateCity(companySlug: string, cityId: string, data: { name: string; state: string }) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) return { error: 'Unauthorized' }
  if (!['company_owner', 'company_admin', 'company_manager'].includes(user.role ?? '')) return { error: 'Insufficient permissions' }
  const parsed = citySchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  try {
    await prisma.city.update({ where: { id: cityId, companyId: user.companyId! }, data: parsed.data })
    await createAuditLog({ companyId: user.companyId, actorId: user.id, actorType: 'employee', actorName: user.name, action: 'update', entityType: 'city', entityId: cityId })
    revalidatePath(`/${companySlug}/cities`)
    return { success: true }
  } catch (e: any) {
    if (e?.code === 'P2002') return { error: 'This city already exists' }
    return { error: 'Failed to update city' }
  }
}

export async function deleteCity(companySlug: string, cityId: string) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) return { error: 'Unauthorized' }
  if (!['company_owner', 'company_admin'].includes(user.role ?? '')) return { error: 'Insufficient permissions' }
  try {
    const city = await prisma.city.findUnique({ where: { id: cityId, companyId: user.companyId! }, include: { _count: { select: { communities: true, customers: true, addresses: true } } } })
    if (!city) return { error: 'City not found' }
    if ((city._count?.communities ?? 0) > 0 || (city._count?.customers ?? 0) > 0 || (city._count?.addresses ?? 0) > 0) return { error: 'Cannot delete city with associated communities, customers, or addresses' }
    await prisma.city.delete({ where: { id: cityId } })
    await createAuditLog({ companyId: user.companyId, actorId: user.id, actorType: 'employee', actorName: user.name, action: 'delete', entityType: 'city', entityId: cityId })
    revalidatePath(`/${companySlug}/cities`)
    return { success: true }
  } catch { return { error: 'Failed to delete city' } }
}
