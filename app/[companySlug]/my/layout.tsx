import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { CustomerNav } from '@/components/layouts/customer-nav'

export const dynamic = 'force-dynamic'

export default async function CustomerLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ companySlug: string }>
}) {
  const resolvedParams = await params
  const session = await getSession()
  const user = getSessionUser(session)

  if (!user || user.userType !== 'customer' || user.companySlug !== resolvedParams.companySlug) {
    redirect(`/${resolvedParams.companySlug}/sign-in`)
  }

  const company = await prisma.company.findUnique({
    where: { slug: resolvedParams.companySlug },
    include: { branding: true },
  })

  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerNav
        companySlug={resolvedParams.companySlug}
        companyName={company?.name ?? 'Company'}
        primaryColor={company?.branding?.primaryColor ?? '#1D4ED8'}
        userName={user.name}
      />
      <main className="max-w-5xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
