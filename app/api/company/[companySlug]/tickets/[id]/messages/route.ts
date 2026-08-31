export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSession, getSessionUser } from '@/lib/session'
import { prisma } from '@/lib/db'

export async function POST(req: Request, { params }: { params: Promise<{ companySlug: string; id: string }> }) {
  const resolvedParams = await params
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ticket = await prisma.ticket.findFirst({
    where: { id: resolvedParams.id, companyId: user.companyId ?? '' },
    include: { customer: { select: { communityId: true, userAccess: { where: { customerUserId: user.id }, select: { id: true }, take: 1 } } } },
  })
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const requestedManagerContext = body?.authorContext === 'community_manager'
  let authorized = false
  let authorType: string = user.userType
  if (user.userType === 'employee') authorized = ticket.serviceRecipient === 'company'
  if (user.userType === 'customer') {
    if (requestedManagerContext && ticket.serviceRecipient === 'community_manager' && ticket.customer.communityId) {
      authorized = Boolean(await prisma.communityMembership.findFirst({
        where: { communityId: ticket.customer.communityId, customerUserId: user.id, role: 'community_manager', isActive: true },
        select: { id: true },
      }))
      if (authorized) authorType = 'community_manager'
    } else {
      authorized = ticket.customer.userAccess.length > 0
      authorType = 'customer'
    }
  }
  if (!authorized) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const isInternal = body?.isInternal ?? false
  const createMessage = prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      content: body?.content ?? '',
      authorId: user.id,
      authorType,
      authorName: user.name,
      isInternal,
    },
  })
  const readReceiptUpdate = !isInternal
    ? authorType === 'customer'
      ? prisma.managerTicketRead.deleteMany({ where: { ticketId: ticket.id } })
      : prisma.customerTicketRead.deleteMany({ where: { ticketId: ticket.id } })
    : null
  const [message] = readReceiptUpdate
    ? await prisma.$transaction([createMessage, readReceiptUpdate])
    : [await createMessage]

  return NextResponse.json(message)
}
