import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { CustomerNav } from '@/components/layouts/customer-nav'
import { getCustomerViewContext } from '@/lib/customer-view'
import { getCustomerCompany } from '@/lib/customer-company'
import { prisma } from '@/lib/db'
import { getUnreadAnnouncementCount } from '@/lib/customer-announcement-notifications'

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

  const viewContextPromise = getCustomerViewContext({ userId: user.id, companyId: user.companyId!, companySlug: resolvedParams.companySlug })
  const [company, viewContext, unreadRequestCount, unreadTicketCount, unreadAnnouncementCount] = await Promise.all([
    getCustomerCompany(user.companyId!),
    viewContextPromise,
    prisma.ticket.count({
      where: {
        companyId: user.companyId!,
        serviceRecipient: 'community_manager',
        managerReads: { none: { customerUserId: user.id } },
        customer: { community: { memberships: { some: { customerUserId: user.id, role: 'community_manager', isActive: true } } } },
      },
    }),
    prisma.ticket.count({
      where: {
        companyId: user.companyId!,
        customer: { userAccess: { some: { customerUserId: user.id } } },
        messages: { some: { authorType: { in: ['employee', 'community_manager'] }, isInternal: false } },
        customerReads: { none: { customerUserId: user.id } },
      },
    }),
    viewContextPromise.then((resolvedViewContext) => getUnreadAnnouncementCount({
      userId: user.id,
      companyId: user.companyId!,
      viewContext: resolvedViewContext,
    })),
  ])

  return (
    <div className="min-h-screen bg-slate-50">
      <CustomerNav
        companySlug={resolvedParams.companySlug}
        companyName={company?.name ?? 'Company'}
        primaryColor={company?.branding?.primaryColor ?? '#1D4ED8'}
        userName={user.name}
        hasCommunityAccess={viewContext.hasResidentCommunity || viewContext.options.some((option) => option.mode !== 'resident')}
        viewContext={viewContext}
        unreadRequestCount={unreadRequestCount}
        unreadTicketCount={unreadTicketCount}
        unreadAnnouncementCount={unreadAnnouncementCount}
      />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        {children}
      </main>
    </div>
  )
}
