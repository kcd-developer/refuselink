'use server'

import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'

const assignmentSchema = z.object({
  communityId: z.string().min(1),
  customerUserId: z.string().min(1),
  positionTitle: z.string().trim().max(100).optional().nullable(),
  publicEmail: z.string().trim().email().optional().nullable().or(z.literal('')),
  publicPhone: z.string().trim().max(30).optional().nullable(),
  showEmail: z.boolean().default(true),
  showPhone: z.boolean().default(true),
})

const managerSchema = assignmentSchema.omit({ customerUserId: true }).extend({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().max(30).optional().nullable(),
  password: z.string().min(8, 'Password must be at least 8 characters').optional().or(z.literal('')),
})

async function authorize(companySlug: string) {
  const user = getSessionUser(await getSession())
  if (!user || user.userType !== 'employee' || user.companySlug !== companySlug) return null
  if (!['company_owner', 'company_admin', 'company_manager'].includes(user.role ?? '')) return null
  return user
}

function clean(value?: string | null) {
  return value?.trim() || null
}

export async function assignBoardMember(companySlug: string, input: unknown) {
  const user = await authorize(companySlug)
  if (!user) return { error: 'Unauthorized' }
  const parsed = assignmentSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid assignment' }
  const data = parsed.data

  const resident = await prisma.customerUserAccess.findFirst({
    where: {
      customerUserId: data.customerUserId,
      customer: { companyId: user.companyId!, communityId: data.communityId },
    },
    include: { customerUser: { select: { email: true, phone: true } } },
  })
  if (!resident) return { error: 'Board members must be residents of this community' }

  await prisma.communityMembership.upsert({
    where: { communityId_customerUserId_role: { communityId: data.communityId, customerUserId: data.customerUserId, role: 'board_member' } },
    create: {
      communityId: data.communityId,
      customerUserId: data.customerUserId,
      role: 'board_member',
      positionTitle: clean(data.positionTitle),
      publicEmail: clean(data.publicEmail) ?? resident.customerUser.email,
      publicPhone: clean(data.publicPhone) ?? resident.customerUser.phone,
      showEmail: data.showEmail,
      showPhone: data.showPhone,
      assignedById: user.id,
    },
    update: {
      role: 'board_member',
      positionTitle: clean(data.positionTitle),
      publicEmail: clean(data.publicEmail) ?? resident.customerUser.email,
      publicPhone: clean(data.publicPhone) ?? resident.customerUser.phone,
      showEmail: data.showEmail,
      showPhone: data.showPhone,
      isActive: true,
      assignedById: user.id,
    },
  })
  revalidatePath(`/${companySlug}/communities`)
  revalidatePath(`/${companySlug}/my`, 'layout')
  return { success: true }
}

export async function assignCommunityManager(companySlug: string, input: unknown) {
  const user = await authorize(companySlug)
  if (!user) return { error: 'Unauthorized' }
  const parsed = managerSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid manager' }
  const data = parsed.data

  let manager = await prisma.customerUser.findUnique({ where: { email: data.email } })
  if (!manager) {
    if (!data.password) return { error: 'A temporary password is required for a new manager' }
    manager = await prisma.customerUser.create({
      data: { name: data.name, email: data.email, phone: clean(data.phone), password: await bcrypt.hash(data.password, 12) },
    })
  }

  await prisma.communityMembership.upsert({
    where: { communityId_customerUserId_role: { communityId: data.communityId, customerUserId: manager.id, role: 'community_manager' } },
    create: {
      communityId: data.communityId,
      customerUserId: manager.id,
      role: 'community_manager',
      positionTitle: clean(data.positionTitle) ?? 'Community Manager',
      publicEmail: clean(data.publicEmail) ?? manager.email,
      publicPhone: clean(data.publicPhone) ?? manager.phone,
      showEmail: data.showEmail,
      showPhone: data.showPhone,
      assignedById: user.id,
    },
    update: {
      role: 'community_manager',
      positionTitle: clean(data.positionTitle) ?? 'Community Manager',
      publicEmail: clean(data.publicEmail) ?? manager.email,
      publicPhone: clean(data.publicPhone) ?? manager.phone,
      showEmail: data.showEmail,
      showPhone: data.showPhone,
      isActive: true,
      assignedById: user.id,
    },
  })
  revalidatePath(`/${companySlug}/communities`)
  revalidatePath(`/${companySlug}/my`, 'layout')
  return { success: true }
}

export async function removeCommunityMembership(companySlug: string, membershipId: string) {
  const user = await authorize(companySlug)
  if (!user) return { error: 'Unauthorized' }
  const membership = await prisma.communityMembership.findFirst({
    where: { id: membershipId, community: { companyId: user.companyId! } },
    select: { communityId: true, role: true },
  })
  if (!membership) return { error: 'Assignment not found' }
  const removed = await prisma.communityMembership.deleteMany({
    where: { id: membershipId, community: { companyId: user.companyId! } },
  })
  if (!removed.count) return { error: 'Assignment not found' }
  if (membership.role === 'community_manager') {
    const remainingManager = await prisma.communityMembership.findFirst({
      where: { communityId: membership.communityId, role: 'community_manager', isActive: true },
      select: { id: true },
    })
    if (!remainingManager) {
      await prisma.community.update({ where: { id: membership.communityId }, data: { serviceIssueRouting: 'company' } })
    }
  }
  revalidatePath(`/${companySlug}/communities`)
  revalidatePath(`/${companySlug}/my`, 'layout')
  return { success: true }
}
