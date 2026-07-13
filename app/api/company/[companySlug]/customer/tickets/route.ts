export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSession, getSessionUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import { generateTicketNumber } from '@/lib/ticket-number'

export async function POST(req: Request, { params }: { params: Promise<{ companySlug: string }> }) {
  const resolvedParams = await params
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'customer' || user.companySlug !== resolvedParams.companySlug) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { subject, message, customerId } = body ?? {}

  if (!subject || !message || !customerId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Verify customer belongs to company and user has access
  const access = await prisma.customerUserAccess.findFirst({
    where: {
      customerUserId: user.id,
      customerId,
      customer: { companyId: user.companyId ?? '' },
    },
  })

  if (!access) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const ticketNumber = await generateTicketNumber(user.companyId ?? '')

  const ticket = await prisma.ticket.create({
    data: {
      companyId: user.companyId ?? '',
      customerId,
      ticketNumber,
      subject,
      status: 'open',
      priority: 'normal',
      createdById: user.id,
      createdByType: 'customer',
      messages: {
        create: {
          content: message,
          authorId: user.id,
          authorType: 'customer',
          authorName: user.name,
        },
      },
    },
  })

  return NextResponse.json(ticket)
}
