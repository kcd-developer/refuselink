import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'

export const dynamic = 'force-dynamic'

const schema = z.object({
  companyAnnouncementIds: z.array(z.string()).max(500).default([]),
  communityAnnouncementIds: z.array(z.string()).max(500).default([]),
})

export async function POST(request: Request, { params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = await params
  const user = getSessionUser(await getSession())
  if (!user || user.userType !== 'customer' || user.companySlug !== companySlug || !user.companyId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const [companyAnnouncements, communityAccess] = await Promise.all([
    prisma.announcement.findMany({
      where: { id: { in: parsed.data.companyAnnouncementIds }, companyId: user.companyId, isPublished: true },
      select: { id: true },
    }),
    prisma.community.findMany({
      where: {
        companyId: user.companyId,
        OR: [
          { customers: { some: { userAccess: { some: { customerUserId: user.id } } } } },
          { memberships: { some: { customerUserId: user.id, isActive: true } } },
        ],
      },
      select: { id: true },
    }),
  ])
  const communityAnnouncements = await prisma.communityAnnouncement.findMany({
    where: {
      id: { in: parsed.data.communityAnnouncementIds },
      companyId: user.companyId,
      communityId: { in: communityAccess.map((community) => community.id) },
      isPublished: true,
    },
    select: { id: true },
  })

  await prisma.$transaction([
    prisma.customerAnnouncementRead.createMany({
      data: companyAnnouncements.map((announcement) => ({ announcementId: announcement.id, customerUserId: user.id, companyId: user.companyId! })),
      skipDuplicates: true,
    }),
    prisma.customerCommunityAnnouncementRead.createMany({
      data: communityAnnouncements.map((announcement) => ({ communityAnnouncementId: announcement.id, customerUserId: user.id })),
      skipDuplicates: true,
    }),
  ])

  return NextResponse.json({ success: true })
}
