import { prisma } from '@/lib/db'
import { UsersClient } from './users-client'

export const dynamic = 'force-dynamic'

export default async function PlatformUsersPage() {
  const users = await prisma.platformUser.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, email: true, name: true, role: true, isActive: true, createdAt: true },
  })
  return <UsersClient users={JSON.parse(JSON.stringify(users))} />
}
