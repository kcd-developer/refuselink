import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { EmployeeProfileClient } from './profile-client'

export const dynamic = 'force-dynamic'

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ companySlug: string }>
}) {
  const resolvedParams = await params
  const session = await getSession()
  const user = getSessionUser(session)

  if (!user || user.userType !== 'employee' || user.companySlug !== resolvedParams.companySlug) {
    redirect(`/${resolvedParams.companySlug}/sign-in`)
  }

  return (
    <EmployeeProfileClient
      companySlug={resolvedParams.companySlug}
      user={{ name: user.name, email: user.email, role: user.role }}
    />
  )
}
