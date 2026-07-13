export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSession, getSessionUser } from '@/lib/session'
import { prisma } from '@/lib/db'

export async function POST(req: Request, { params }: { params: { companySlug: string; id: string } }) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ticket = await prisma.ticket.findFirst({
    where: { id: params.id, companyId: user.companyId ?? '' },
  })
  if (!ticket) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const message = await prisma.ticketMessage.create({
    data: {
      ticketId: ticket.id,
      content: body?.content ?? '',
      authorId: user.id,
      authorType: user.userType,
      authorName: user.name,
      isInternal: body?.isInternal ?? false,
    },
  })

  return NextResponse.json(message)
}
