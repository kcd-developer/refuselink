import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { getCustomerViewContext } from '@/lib/customer-view'
import { MarkRequestsRead } from './mark-requests-read'
import { AutoRefresh } from '@/components/auto-refresh'

export const dynamic = 'force-dynamic'

const statusLabels: Record<string, string> = { open: 'Open', in_progress: 'In Progress', waiting_on_customer: 'Awaiting Response', resolved: 'Resolved', closed: 'Closed' }

export default async function ManagedTicketsPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = await params
  const user = getSessionUser(await getSession())
  if (!user || user.userType !== 'customer' || user.companySlug !== companySlug || !user.companyId) redirect(`/${companySlug}/sign-in`)
  const context = await getCustomerViewContext({ userId: user.id, companyId: user.companyId, companySlug })
  if (context.active.mode !== 'manager') redirect(`/${companySlug}/my/community`)
  const communityIds = context.managerCommunities.map((community) => community.id)
  const tickets = await prisma.ticket.findMany({
    where: { companyId: user.companyId, serviceRecipient: 'community_manager', customer: { communityId: { in: communityIds } } },
    include: { customer: { select: { name: true, community: { select: { name: true } } } }, messages: { where: { isInternal: false }, orderBy: { createdAt: 'desc' }, take: 1 }, managerReads: { where: { customerUserId: user.id }, select: { id: true } } },
    orderBy: { updatedAt: 'desc' },
  })

  return (
    <div className="max-w-4xl">
      <AutoRefresh />
      <MarkRequestsRead companySlug={companySlug} ticketIds={tickets.filter((ticket) => !ticket.managerReads.length).map((ticket) => ticket.id)} />
      <div className="mb-7"><h1 className="font-display text-2xl font-bold text-slate-900">Resident Requests</h1><p className="mt-1 text-sm text-slate-500">Requests routed to you by the communities you manage</p></div>
      <div className="space-y-3">
        {tickets.map((ticket) => (
          <Link key={ticket.id} href={`/${companySlug}/my/managed-tickets/${ticket.id}`} className={`block rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${ticket.managerReads.length ? 'border-slate-200' : 'border-blue-300 ring-1 ring-blue-100'}`}>
            <div className="flex items-start justify-between gap-4"><div><div className="flex items-center gap-2"><p className="text-xs font-medium text-blue-600">{ticket.customer.community?.name}</p>{!ticket.managerReads.length && <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">New</span>}</div><h2 className="mt-1 font-medium text-slate-900">{ticket.subject}</h2><div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500"><span>{ticket.ticketNumber}</span><span>{statusLabels[ticket.status] ?? ticket.status}</span><span>{ticket.updatedAt.toLocaleDateString('en-US')}</span></div></div><MessageSquare className="h-5 w-5 text-slate-300" /></div>
            {ticket.messages[0] && <p className="mt-3 line-clamp-1 text-sm text-slate-500">{ticket.messages[0].content}</p>}
          </Link>
        ))}
        {!tickets.length && <div className="rounded-xl border border-slate-200 bg-white px-6 py-14 text-center text-sm text-slate-400">No resident requests are currently routed to you.</div>}
      </div>
    </div>
  )
}
