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
    include: {
      accounts: {
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
