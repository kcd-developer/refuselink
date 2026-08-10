export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSession, getSessionUser } from '@/lib/session'
import { prisma } from '@/lib/db'
import { generateTicketNumber } from '@/lib/ticket-number'
import { z } from 'zod'

const ticketSchema = z.object({
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
  customerId: z.string().min(1),
  category: z.enum(['missed_pickup', 'recycling_issue', 'yard_waste_issue', 'cart_issue', 'illegal_dumping', 'community_cleanliness', 'service_delay', 'billing_account', 'other']),
})

export async function POST(req: Request, { params }: { params: Promise<{ companySlug: string }> }) {
  const resolvedParams = await params
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'customer' || user.companySlug !== resolvedParams.companySlug) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const parsed = ticketSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid ticket' }, { status: 400 })
  const { subject, message, customerId, category } = parsed.data

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
      category,
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
