import 'server-only'

import { cookies } from 'next/headers'
import { unstable_noStore as noStore } from 'next/cache'
import { cache } from 'react'
import { prisma } from '@/lib/db'

export type CustomerViewMode = 'resident' | 'board' | 'manager'

export interface CustomerViewOption {
  key: string
  mode: CustomerViewMode
  label: string
  communityId: string | null
  communityName: string | null
  allCommunities?: boolean
}

export interface CustomerViewContext {
  active: CustomerViewOption
  options: CustomerViewOption[]
  hasResidentCommunity: boolean
  managerCommunities: Array<{ id: string; name: string }>
}

export function customerViewCookieName(companySlug: string) {
  return `refuselink-view-${companySlug}`
}

const resolveCustomerViewContext = cache(async (
  userId: string,
  companyId: string,
  companySlug: string,
): Promise<CustomerViewContext> => {
  // Community assignments can change while a customer is signed in. Always
  // resolve the available personas from the live role rows.
  noStore()
  const [residentAccess, memberships] = await Promise.all([
    prisma.customerUserAccess.findMany({
      where: { customerUserId: userId, customer: { companyId } },
      select: { customer: { select: { communityId: true } } },
    }),
    prisma.communityMembership.findMany({
      where: { customerUserId: userId, isActive: true, community: { companyId } },
      select: { role: true, communityId: true, community: { select: { name: true } } },
      orderBy: [{ role: 'asc' }, { community: { name: 'asc' } }],
    }),
  ])

  const options: CustomerViewOption[] = []
  if (residentAccess.length) {
    options.push({ key: 'resident', mode: 'resident', label: 'Resident View', communityId: null, communityName: null })
  }

  for (const membership of memberships.filter((item) => item.role === 'board_member')) {
    options.push({
      key: `board:${membership.communityId}`,
      mode: 'board',
      label: `Board Member — ${membership.community.name}`,
      communityId: membership.communityId,
      communityName: membership.community.name,
    })
  }

  const managerMemberships = memberships.filter((item) => item.role === 'community_manager')
  if (managerMemberships.length) {
    options.push({
      key: 'manager:all',
      mode: 'manager',
      label: 'Community Manager',
      communityId: null,
      communityName: null,
      allCommunities: true,
    })
  }

  // Authentication guarantees at least an account or community membership,
  // but keep a safe fallback for records changed during an active session.
  const fallback = options[0] ?? {
    key: 'resident', mode: 'resident' as const, label: 'Resident View', communityId: null, communityName: null,
  }
  const requestedKey = (await cookies()).get(customerViewCookieName(companySlug))?.value
  const active = options.find((option) => option.key === requestedKey) ?? fallback

  return {
    active,
    options: options.length ? options : [fallback],
    hasResidentCommunity: residentAccess.some((access) => Boolean(access.customer.communityId)),
    managerCommunities: managerMemberships.map((membership) => ({
      id: membership.communityId,
      name: membership.community.name,
    })),
  }
})

export function getCustomerViewContext({
  userId,
  companyId,
  companySlug,
}: {
  userId: string
  companyId: string
  companySlug: string
}) {
  return resolveCustomerViewContext(userId, companyId, companySlug)
}
