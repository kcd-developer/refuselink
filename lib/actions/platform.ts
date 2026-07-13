'use server'

import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { createAuditLog } from '@/lib/audit'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

function requirePlatformAdmin(user: any) {
  return user && user.userType === 'platform' && ['platform_owner', 'platform_admin'].includes(user.role ?? '')
}

// --- Company Management ---
const companyCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  code: z.string().min(1).max(50),
  planId: z.string().optional().nullable(),
})

export async function createCompany(data: any) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!requirePlatformAdmin(user)) return { error: 'Unauthorized' }
  const parsed = companyCreateSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  const d = parsed.data
  try {
    const company = await prisma.company.create({
      data: { name: d.name, slug: d.slug, code: d.code, status: 'trial' },
    })
    // Create default branding
    await prisma.companyBranding.create({ data: { companyId: company.id } })
    // Create subscription if plan provided
    if (d.planId) {
      await prisma.subscription.create({
        data: { companyId: company.id, planId: d.planId, billingCycle: 'monthly', status: 'trial', startDate: new Date() },
      })
    }
    await createAuditLog({ actorId: user!.id, actorType: 'platform', actorName: user!.name, action: 'create', entityType: 'company', entityId: company.id })
    revalidatePath('/platform/companies')
    return { success: true, company }
  } catch (e: any) {
    if (e?.code === 'P2002') return { error: 'Company slug or code already exists' }
    return { error: 'Failed to create company' }
  }
}

export async function updateCompanyStatus(companyId: string, status: string) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!requirePlatformAdmin(user)) return { error: 'Unauthorized' }
  try {
    await prisma.company.update({ where: { id: companyId }, data: { status: status as any } })
    await createAuditLog({ actorId: user!.id, actorType: 'platform', actorName: user!.name, action: `company_${status}`, entityType: 'company', entityId: companyId })
    revalidatePath('/platform/companies')
    return { success: true }
  } catch { return { error: 'Failed to update company' } }
}

// --- Plan Management ---
const planSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  monthlyPriceCents: z.number().int().min(0),
  annualPriceCents: z.number().int().min(0),
  maxCommunities: z.number().int().min(0).optional().nullable(),
  maxCustomers: z.number().int().min(0).optional().nullable(),
  maxStaffUsers: z.number().int().min(0).optional().nullable(),
  features: z.any().default({}),
  isActive: z.boolean().default(true),
  displayOrder: z.number().int().default(0),
})

export async function createPlan(data: any) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!requirePlatformAdmin(user)) return { error: 'Unauthorized' }
  const parsed = planSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  try {
    await prisma.plan.create({ data: parsed.data as any })
    revalidatePath('/platform/plans')
    return { success: true }
  } catch (e: any) {
    if (e?.code === 'P2002') return { error: 'Plan slug already exists' }
    return { error: 'Failed to create plan' }
  }
}

export async function updatePlan(planId: string, data: any) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!requirePlatformAdmin(user)) return { error: 'Unauthorized' }
  try {
    const updateData: any = {}
    if (data.name) updateData.name = data.name
    if (data.monthlyPriceCents !== undefined) updateData.monthlyPriceCents = data.monthlyPriceCents
    if (data.annualPriceCents !== undefined) updateData.annualPriceCents = data.annualPriceCents
    if (data.maxCommunities !== undefined) updateData.maxCommunities = data.maxCommunities
    if (data.maxCustomers !== undefined) updateData.maxCustomers = data.maxCustomers
    if (data.maxStaffUsers !== undefined) updateData.maxStaffUsers = data.maxStaffUsers
    if (data.features !== undefined) updateData.features = data.features
    if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive
    if (data.displayOrder !== undefined) updateData.displayOrder = data.displayOrder
    await prisma.plan.update({ where: { id: planId }, data: updateData })
    revalidatePath('/platform/plans')
    return { success: true }
  } catch { return { error: 'Failed to update plan' } }
}

// --- Platform User Management ---
const platformUserSchema = z.object({
  name: z.string().min(1).max(200),
  email: z.string().email(),
  role: z.enum(['platform_owner', 'platform_admin', 'platform_support', 'platform_sales']),
  password: z.string().min(8).optional(),
  isActive: z.boolean().default(true),
})

export async function createPlatformUser(data: any) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'platform' || user.role !== 'platform_owner') return { error: 'Unauthorized' }
  const parsed = platformUserSchema.safeParse(data)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid input' }
  if (!data.password) return { error: 'Password is required' }
  try {
    const hashedPassword = await bcrypt.hash(data.password, 12)
    await prisma.platformUser.create({ data: { name: parsed.data.name, email: parsed.data.email, role: parsed.data.role, password: hashedPassword, isActive: parsed.data.isActive } })
    revalidatePath('/platform/users')
    return { success: true }
  } catch (e: any) {
    if (e?.code === 'P2002') return { error: 'Email already exists' }
    return { error: 'Failed to create user' }
  }
}

export async function updatePlatformUser(userId: string, data: any) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'platform' || user.role !== 'platform_owner') return { error: 'Unauthorized' }
  const updateData: any = {}
  if (data.name) updateData.name = data.name
  if (data.email) updateData.email = data.email
  if (data.role) updateData.role = data.role
  if (typeof data.isActive === 'boolean') updateData.isActive = data.isActive
  if (data.password && data.password.length >= 8) updateData.password = await bcrypt.hash(data.password, 12)
  try {
    await prisma.platformUser.update({ where: { id: userId }, data: updateData })
    revalidatePath('/platform/users')
    return { success: true }
  } catch (e: any) {
    if (e?.code === 'P2002') return { error: 'Email already exists' }
    return { error: 'Failed to update user' }
  }
}
