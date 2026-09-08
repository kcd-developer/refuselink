export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { ProfileClient } from './profile-client'

export default async function ProfilePage({ params }: { params: Promise<{ companySlug: string }> }) {
  const resolvedParams = await params
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'customer' || user.companySlug !== resolvedParams.companySlug) redirect(`/${resolvedParams.companySlug}/sign-in`)

  const customerUser = await prisma.customerUser.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      communityMemberships: {
        where: { role: 'board_member', isActive: true, community: { companyId: user.companyId! } },
        select: { id: true, publicEmail: true, publicPhone: true, shareEmailWithCommunity: true, sharePhoneWithCommunity: true, community: { select: { name: true } } },
        orderBy: { community: { name: 'asc' } },
      },
      accounts: {
        where: { customer: { companyId: user.companyId! } },
        include: {
          customer: {
            include: { cityRef: { select: { name: true, state: true } }, community: { select: { name: true } } }
          }
        }
      }
    }
  })

  if (!customerUser) redirect(`/${resolvedParams.companySlug}/sign-in`)

  return <ProfileClient customerUser={customerUser as any} companySlug={resolvedParams.companySlug} />
}
