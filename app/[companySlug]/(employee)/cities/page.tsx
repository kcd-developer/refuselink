import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { CitiesClient } from './cities-client'

export const dynamic = 'force-dynamic'

export default async function CitiesPage({ params }: { params: { companySlug: string } }) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee') redirect(`/${params.companySlug}/sign-in`)

  const cities = await prisma.city.findMany({
    where: { companyId: user.companyId ?? '' },
    include: { _count: { select: { communities: true, customers: true } } },
    orderBy: { name: 'asc' },
  })

  return <CitiesClient cities={JSON.parse(JSON.stringify(cities ?? []))} companySlug={params.companySlug} />
}
