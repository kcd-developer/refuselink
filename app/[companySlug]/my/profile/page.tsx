export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { ProfileClient } from './profile-client'

export default async function ProfilePage({ params }: { params: { companySlug: string } }) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'customer' || user.companySlug !== params.companySlug) redirect(`/${params.companySlug}/sign-in`)

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

  if (!customerUser) redirect(`/${params.companySlug}/sign-in`)

  return <ProfileClient customerUser={customerUser as any} companySlug={params.companySlug} />
}
