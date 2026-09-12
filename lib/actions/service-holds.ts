'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { createAuditLog } from '@/lib/audit'

const requestSchema = z.object({
  addressId: z.string().min(1),
  action: z.enum(['suspend', 'restore']),
  note: z.string().trim().max(1000).optional().nullable(),
})

const processSchema = z.object({
  requestId: z.string().min(1),
  decision: z.enum(['complete', 'reject']),
  note: z.string().trim().max(1000).optional().nullable(),
})

function clean(value?: string | null) {
  return value?.trim() || null
}

function revalidateServiceHoldPaths(companySlug: string) {
  revalidatePath(`/${companySlug}/service-holds`)
  revalidatePath(`/${companySlug}/my/service-holds`)
  revalidatePath(`/${companySlug}/my`)
  revalidatePath(`/${companySlug}/my/tickets`)
}

export async function requestServiceHold(companySlug: string, input: unknown) {
  const user = getSessionUser(await getSession())
  if (!user || user.userType !== 'customer' || user.companySlug !== companySlug || !user.companyId) return { error: 'Unauthorized' }
  const parsed = requestSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid request' }

  const address = await prisma.address.findFirst({
    where: {
      id: parsed.data.addressId,
      companyId: user.companyId,
      communityId: { not: null },
      community: { memberships: { some: { customerUserId: user.id, isActive: true, role: { in: ['board_member', 'community_manager'] } } } },
    },
    select: { id: true, communityId: true, serviceStatus: true, address: true },
  })
  if (!address?.communityId) return { error: 'You cannot manage service for this address' }

  const expectedStatus = parsed.data.action === 'suspend' ? 'active' : 'suspended'
  const pendingStatus = parsed.data.action === 'suspend' ? 'suspension_pending' : 'restoration_pending'
  if (address.serviceStatus !== expectedStatus) {
    return { error: parsed.data.action === 'suspend' ? 'This address is not currently eligible for suspension' : 'This address is not currently suspended' }
  }

  try {
    const request = await prisma.$transaction(async (tx) => {
      const updated = await tx.address.updateMany({
        where: { id: address.id, companyId: user.companyId!, serviceStatus: expectedStatus },
        data: { serviceStatus: pendingStatus, serviceStatusUpdatedAt: new Date() },
      })
      if (!updated.count) throw new Error('STATUS_CHANGED')
      return tx.serviceHoldRequest.create({
        data: {
          companyId: user.companyId!,
          communityId: address.communityId!,
          addressId: address.id,
          action: parsed.data.action,
          requestedById: user.id,
          requestNote: clean(parsed.data.note),
        },
      })
    })
    await createAuditLog({
      companyId: user.companyId,
      actorId: user.id,
      actorType: 'customer',
      actorName: user.name,
      action: `request_${parsed.data.action}`,
      entityType: 'service_hold',
      entityId: request.id,
      metadata: { addressId: address.id, address: address.address },
    })
    revalidateServiceHoldPaths(companySlug)
    return { success: true }
  } catch (error) {
    if (error instanceof Error && error.message === 'STATUS_CHANGED') return { error: 'The address status changed. Refresh and try again.' }
    return { error: 'Unable to submit the request. Please try again.' }
  }
}

export async function processServiceHoldRequest(companySlug: string, input: unknown) {
  const user = getSessionUser(await getSession())
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug || !user.companyId) return { error: 'Unauthorized' }
  if (!['company_owner', 'company_admin', 'company_manager'].includes(user.role ?? '')) return { error: 'Insufficient permissions' }
  const parsed = processSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid request' }

  const existing = await prisma.serviceHoldRequest.findFirst({
    where: { id: parsed.data.requestId, companyId: user.companyId, status: 'pending' },
    select: { id: true, addressId: true, action: true },
  })
  if (!existing) return { error: 'Pending request not found' }

  const pendingStatus = existing.action === 'suspend' ? 'suspension_pending' : 'restoration_pending'
  const resultingStatus = parsed.data.decision === 'complete'
    ? existing.action === 'suspend' ? 'suspended' : 'active'
    : existing.action === 'suspend' ? 'active' : 'suspended'

  try {
    await prisma.$transaction(async (tx) => {
      const processed = await tx.serviceHoldRequest.updateMany({
        where: { id: existing.id, companyId: user.companyId!, status: 'pending' },
        data: {
          status: parsed.data.decision === 'complete' ? 'completed' : 'rejected',
          processedById: user.id,
          processedByName: user.name,
          internalNote: clean(parsed.data.note),
          processedAt: new Date(),
        },
      })
      if (!processed.count) throw new Error('ALREADY_PROCESSED')
      const address = await tx.address.updateMany({
        where: { id: existing.addressId, companyId: user.companyId!, serviceStatus: pendingStatus },
        data: { serviceStatus: resultingStatus, serviceStatusUpdatedAt: new Date() },
      })
      if (!address.count) throw new Error('STATUS_CHANGED')
    })
    await createAuditLog({
      companyId: user.companyId,
      actorId: user.id,
      actorType: 'employee',
      actorName: user.name,
      action: parsed.data.decision === 'complete' ? `complete_${existing.action}` : `reject_${existing.action}`,
      entityType: 'service_hold',
      entityId: existing.id,
      metadata: { addressId: existing.addressId },
    })
    revalidateServiceHoldPaths(companySlug)
    return { success: true }
  } catch {
    return { error: 'The request or address status changed. Refresh and try again.' }
  }
}
