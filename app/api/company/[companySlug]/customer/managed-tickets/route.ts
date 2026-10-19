export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { generateTicketNumber } from '@/lib/ticket-number'

const schema = z.object({
  communityId: z.string().min(1),
  scope: z.enum(['address', 'community']),
  addressId: z.string().min(1).optional().nullable(),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(5000),
  category: z.enum(['missed_pickup', 'recycling_issue', 'yard_waste_issue', 'cart_issue', 'illegal_dumping', 'community_cleanliness', 'service_delay', 'billing_account', 'other']),
})

export async function POST(request: Request, { params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = await params
  const user = getSessionUser(await getSession())
  if (!user || user.userType !== 'customer' || user.companySlug !== companySlug || !user.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid request' }, { status: 400 })
  const data = parsed.data
  if (data.scope === 'address' && !data.addressId) return NextResponse.json({ error: 'Select an affected address.' }, { status: 400 })

  const membership = await prisma.communityMembership.findFirst({
    where: { communityId: data.communityId, customerUserId: user.id, role: 'community_manager', isActive: true, community: { companyId: user.companyId } },
    select: { community: { select: { id: true, name: true } } },
  })
  if (!membership) return NextResponse.json({ error: 'You do not manage this community.' }, { status: 403 })

  let address: { id: string; address: string; address2: string | null } | null = null
  if (data.scope === 'address') {
    address = await prisma.address.findFirst({
      where: { id: data.addressId!, communityId: data.communityId, companyId: user.companyId },
      select: { id: true, address: true, address2: true },
    })
    if (!address) return NextResponse.json({ error: 'The selected address was not found in this community.' }, { status: 404 })
  }

  const ticketNumber = await generateTicketNumber(user.companyId)
  const ticket = await prisma.ticket.create({
    data: {
      companyId: user.companyId,
      customerId: null,
      communityId: data.communityId,
      addressId: address?.id ?? null,
      requestScope: data.scope,
      residentVisible: false,
      ticketNumber,
      subject: data.subject,
      category: data.category,
      status: 'open',
      priority: data.scope === 'community' ? 'high' : 'normal',
      serviceRecipient: 'company',
      createdById: user.id,
      createdByType: 'community_manager',
      messages: { create: { content: data.message, authorId: user.id, authorType: 'community_manager', authorName: user.name } },
    },
    include: { messages: { select: { id: true }, orderBy: { createdAt: 'asc' }, take: 1 } },
  })

  return NextResponse.json({ ...ticket, initialMessageId: ticket.messages[0]?.id })
}
