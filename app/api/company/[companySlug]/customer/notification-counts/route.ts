import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { getCustomerViewContext } from '@/lib/customer-view'
import { getUnreadAnnouncementCount } from '@/lib/customer-announcement-notifications'

export const dynamic = 'force-dynamic'

export async function GET(_request: Request, { params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = await params
  const user = getSessionUser(await getSession())
  if (!user || user.userType !== 'customer' || user.companySlug !== companySlug || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const viewContext = await getCustomerViewContext({ userId: user.id, companyId: user.companyId, companySlug })
  const [managerRequests, residentTickets, announcements] = await Promise.all([
    prisma.ticket.count({
      where: {
        companyId: user.companyId,
        managerReads: { none: { customerUserId: user.id } },
        community: { memberships: { some: { customerUserId: user.id, role: 'community_manager', isActive: true } } },
        OR: [
          { serviceRecipient: 'community_manager' },
          { createdByType: 'community_manager', messages: { some: { authorType: 'employee', isInternal: false } } },
        ],
      },
    }),
    prisma.ticket.count({
      where: {
        companyId: user.companyId,
        residentVisible: true,
        customer: { userAccess: { some: { customerUserId: user.id } } },
        messages: { some: { authorType: { in: ['employee', 'community_manager'] }, isInternal: false } },
        customerReads: { none: { customerUserId: user.id } },
      },
    }),
    getUnreadAnnouncementCount({ userId: user.id, companyId: user.companyId, viewContext }),
  ])
  return NextResponse.json({ managerRequests, residentTickets, announcements })
}
