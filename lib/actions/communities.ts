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

const routeAssignmentSchema = z.object({
  service: z.enum(['trash', 'recycling', 'yard_waste']),
  route: z.string().trim().min(1, 'Route is required').max(100),
  containerSize: z.string().trim().max(30).optional().nullable(),
  dayOfWeek: z.number().int().min(0).max(6),
})

function normalizeContainerSize(value?: string | null) {
  const cleaned = value?.trim()
  if (!cleaned) return null
  const match = cleaned.toLocaleLowerCase().match(/^(\d+(?:\.\d+)?)\s*(?:g|gal|gallon|gallons)?$/)
  return match ? `${match[1]}g` : cleaned
}

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
    const comm = await prisma.community.findUnique({ where: { id: communityId, companyId: user.companyId! }, include: { _count: { select: { customers: true, addresses: true } } } })
    if (!comm) return { error: 'Community not found' }
    if ((comm._count?.customers ?? 0) > 0 || (comm._count?.addresses ?? 0) > 0) return { error: 'Cannot delete community with associated customers or addresses' }
    await prisma.community.delete({ where: { id: communityId } })
    revalidatePath(`/${companySlug}/communities`)
    return { success: true }
  } catch { return { error: 'Failed to delete community' } }
}

export async function applyCommunityRouteAssignment(companySlug: string, communityId: string, input: unknown) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) return { error: 'Unauthorized' }
  if (!['company_owner', 'company_admin', 'company_manager'].includes(user.role ?? '')) return { error: 'Insufficient permissions' }
  const parsed = routeAssignmentSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid route assignment' }

  const community = await prisma.community.findFirst({ where: { id: communityId, companyId: user.companyId! }, select: { id: true, name: true } })
  if (!community) return { error: 'Community not found' }

  const addresses = await prisma.address.findMany({ where: { companyId: user.companyId!, communityId }, select: { id: true } })
  if (!addresses.length) return { error: 'This community has no addresses' }
  const addressIds = addresses.map((address) => address.id)
  const assignment = {
    ...parsed.data,
    route: companySlug === 'kc-disposal' ? parsed.data.route.toLocaleUpperCase() : parsed.data.route,
    containerSize: normalizeContainerSize(parsed.data.containerSize),
  }

  await prisma.$transaction(async (tx) => {
    await tx.addressService.updateMany({
      where: { addressId: { in: addressIds }, service: parsed.data.service },
      data: { route: assignment.route, containerSize: assignment.containerSize, dayOfWeek: assignment.dayOfWeek },
    })
    await tx.addressService.createMany({
      data: addressIds.map((addressId) => ({ addressId, service: assignment.service, route: assignment.route, containerSize: assignment.containerSize, dayOfWeek: assignment.dayOfWeek })),
      skipDuplicates: true,
    })
  }, { timeout: 30000 })

  await createAuditLog({
    companyId: user.companyId,
    actorId: user.id,
    actorType: 'employee',
    actorName: user.name,
    action: 'bulk_route_assignment',
    entityType: 'community',
    entityId: communityId,
    metadata: { ...parsed.data, addressCount: addressIds.length },
  })
  revalidatePath(`/${companySlug}/communities`)
  revalidatePath(`/${companySlug}/addresses`)
  revalidatePath(`/${companySlug}/my`)
  revalidatePath(`/${companySlug}/my/service-schedules`)
  return { success: true, updated: addressIds.length }
}

export async function removeCommunityServiceAssignment(companySlug: string, communityId: string, service: unknown) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) return { error: 'Unauthorized' }
  if (!['company_owner', 'company_admin', 'company_manager'].includes(user.role ?? '')) return { error: 'Insufficient permissions' }
  const parsedService = z.enum(['trash', 'recycling', 'yard_waste']).safeParse(service)
  if (!parsedService.success) return { error: 'Invalid service' }
  const community = await prisma.community.findFirst({ where: { id: communityId, companyId: user.companyId! }, select: { id: true } })
  if (!community) return { error: 'Community not found' }

  const removed = await prisma.addressService.deleteMany({
    where: { service: parsedService.data, address: { companyId: user.companyId!, communityId } },
  })
  await createAuditLog({
    companyId: user.companyId, actorId: user.id, actorType: 'employee', actorName: user.name,
    action: 'bulk_service_removal', entityType: 'community', entityId: communityId,
    metadata: { service: parsedService.data, assignmentCount: removed.count },
  })
  revalidatePath(`/${companySlug}/communities`)
  revalidatePath(`/${companySlug}/addresses`)
  revalidatePath(`/${companySlug}/my`)
  revalidatePath(`/${companySlug}/my/service-schedules`)
  return { success: true, removed: removed.count }
}
