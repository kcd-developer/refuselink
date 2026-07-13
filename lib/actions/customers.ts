'use server'

import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { createAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const customerSchema = z.object({
  type: z.enum(['residential', 'commercial', 'roll_off']),
  name: z.string().min(1, 'Name is required').max(200),
  contactName: z.string().max(200).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().max(30).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  address2: z.string().max(200).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  state: z.string().max(50).optional().nullable(),
  zipCode: z.string().max(20).optional().nullable(),
  cityId: z.string().optional().nullable(),
  communityId: z.string().optional().nullable(),
  accountNumber: z.string().max(50).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
})

function normalizeRole(role: string | undefined) {
  return ['company_owner', 'company_admin', 'company_manager', 'csr'].includes(role ?? '') 
}

export async function createCustomer(companySlug: string, data: any) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) return { error: 'Unauthorized' }
  if (!normalizeRole(user.role)) return { error: 'Insufficient permissions' }
  const parsed = customerSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  const d = parsed.data
  try {
    const customer = await prisma.customer.create({
      data: {
        companyId: user.companyId!,
        type: d.type,
        name: d.name,
        contactName: d.contactName || null,
        email: d.email || null,
        phone: d.phone || null,
        address: d.address || null,
        address2: d.address2 || null,
        city: d.city || null,
        state: d.state || null,
        zipCode: d.zipCode || null,
        cityId: d.cityId || null,
        communityId: d.communityId || null,
        accountNumber: d.accountNumber || null,
        notes: d.notes || null,
      },
    })
    await createAuditLog({ companyId: user.companyId, actorId: user.id, actorType: 'employee', actorName: user.name, action: 'create', entityType: 'customer', entityId: customer.id })
    revalidatePath(`/${companySlug}/customers`)
    return { success: true, customer }
  } catch { return { error: 'Failed to create customer' } }
}

export async function updateCustomer(companySlug: string, customerId: string, data: any) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) return { error: 'Unauthorized' }
  if (!normalizeRole(user.role)) return { error: 'Insufficient permissions' }
  const parsed = customerSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  const d = parsed.data
  try {
    await prisma.customer.update({
      where: { id: customerId, companyId: user.companyId! },
      data: {
        type: d.type,
        name: d.name,
        contactName: d.contactName || null,
        email: d.email || null,
        phone: d.phone || null,
        address: d.address || null,
        address2: d.address2 || null,
        city: d.city || null,
        state: d.state || null,
        zipCode: d.zipCode || null,
        cityId: d.cityId || null,
        communityId: d.communityId || null,
        accountNumber: d.accountNumber || null,
        notes: d.notes || null,
      },
    })
    await createAuditLog({ companyId: user.companyId, actorId: user.id, actorType: 'employee', actorName: user.name, action: 'update', entityType: 'customer', entityId: customerId })
    revalidatePath(`/${companySlug}/customers`)
    return { success: true }
  } catch { return { error: 'Failed to update customer' } }
}
