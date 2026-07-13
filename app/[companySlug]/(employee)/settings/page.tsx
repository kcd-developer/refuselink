import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { SettingsClient } from './settings-client'

export const dynamic = 'force-dynamic'

export default async function SettingsPage({ params }: { params: { companySlug: string } }) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'employee') redirect(`/${params.companySlug}/sign-in`)

  if (!['company_owner', 'company_admin'].includes(user.role ?? '')) {
    redirect(`/${params.companySlug}/dashboard`)
  }

  const company = await prisma.company.findUnique({
    where: { id: user.companyId ?? '' },
    include: { branding: true, subscription: { include: { plan: true } } },
  })

  return <SettingsClient company={JSON.parse(JSON.stringify(company))} companySlug={params.companySlug} />
}
