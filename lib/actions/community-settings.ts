'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'

const schema = z.object({
  communityId: z.string().min(1),
  serviceIssueRouting: z.enum(['company', 'community_manager']),
})

export async function updateCommunityServiceRouting(companySlug: string, input: unknown) {
  const user = getSessionUser(await getSession())
  if (!user || user.userType !== 'customer' || user.companySlug !== companySlug || !user.companyId) return { error: 'Unauthorized' }
  const parsed = schema.safeParse(input)
  if (!parsed.success) return { error: 'Invalid community setting' }

  const boardMembership = await prisma.communityMembership.findFirst({
    where: {
      communityId: parsed.data.communityId,
      customerUserId: user.id,
      role: 'board_member',
      isActive: true,
      community: { companyId: user.companyId },
    },
    select: { id: true },
  })
  if (!boardMembership) return { error: 'Only active board members can change this setting' }

  if (parsed.data.serviceIssueRouting === 'community_manager') {
    const manager = await prisma.communityMembership.findFirst({
      where: { communityId: parsed.data.communityId, role: 'community_manager', isActive: true },
      select: { id: true },
    })
    if (!manager) return { error: 'Assign an active Community Manager before using manager routing' }
  }

  await prisma.community.update({
    where: { id: parsed.data.communityId, companyId: user.companyId },
    data: { serviceIssueRouting: parsed.data.serviceIssueRouting },
  })
  revalidatePath(`/${companySlug}/my/community/settings`)
  revalidatePath(`/${companySlug}/my/tickets`)
  return { success: true }
}
