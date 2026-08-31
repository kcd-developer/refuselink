import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(_request: Request, { params }: { params: Promise<{ companySlug: string; id: string }> }) {
  const { companySlug, id } = await params
  const user = getSessionUser(await getSession())
  if (!user || user.userType !== 'customer' || user.companySlug !== companySlug || !user.companyId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const ticket = await prisma.ticket.findFirst({ where: { id, companyId: user.companyId, serviceRecipient: 'community_manager' }, select: { id: true, customer: { select: { communityId: true } } } })
  if (!ticket?.customer.communityId) return NextResponse.json({ error: 'Request not found' }, { status: 404 })
  const manager = await prisma.communityMembership.findFirst({ where: { communityId: ticket.customer.communityId, customerUserId: user.id, role: 'community_manager', isActive: true }, select: { id: true } })
  if (!manager) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  await prisma.ticket.update({ where: { id }, data: { serviceRecipient: 'company', escalatedAt: new Date(), customerReads: { deleteMany: {} }, messages: { create: { content: 'This request was escalated to KC Disposal by the Community Manager.', authorId: user.id, authorType: 'community_manager', authorName: user.name } } } })
  return NextResponse.json({ success: true, href: `/${companySlug}/my/managed-tickets` })
}
