import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { CompanySidebar } from '@/components/layouts/company-sidebar'

export const dynamic = 'force-dynamic'

export default async function EmployeeLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ companySlug: string }>
}) {
  const resolvedParams = await params
  const session = await getSession()
  const user = getSessionUser(session)

  if (!user || user.userType !== 'employee' || user.companySlug !== resolvedParams.companySlug) {
    redirect(`/${resolvedParams.companySlug}/sign-in`)
  }

  const company = await prisma.company.findUnique({
    where: { slug: resolvedParams.companySlug },
    include: { branding: true },
  })

  return (
    <div className="flex min-h-screen bg-slate-50">
      <CompanySidebar
        companySlug={resolvedParams.companySlug}
        companyName={company?.name ?? 'Company'}
        primaryColor={company?.branding?.primaryColor ?? '#1D4ED8'}
      />
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
