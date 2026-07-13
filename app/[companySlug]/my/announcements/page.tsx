import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { Megaphone, AlertTriangle, Info, AlertCircle } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CustomerAnnouncementsPage({ params }: { params: { companySlug: string } }) {
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'customer') redirect(`/${params.companySlug}/sign-in`)

  const announcements = await prisma.announcement.findMany({
    where: { companyId: user.companyId ?? '', isPublished: true },
    orderBy: { createdAt: 'desc' },
  })

  const priorityConfig: Record<string, { color: string; icon: any }> = {
    low: { color: 'bg-slate-50 text-slate-600', icon: Info },
    normal: { color: 'bg-blue-50 text-blue-600', icon: Info },
    high: { color: 'bg-orange-50 text-orange-600', icon: AlertTriangle },
    urgent: { color: 'bg-red-50 text-red-600', icon: AlertCircle },
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Announcements</h1>
        <p className="text-sm text-slate-500 mt-1">Stay informed about service updates</p>
      </div>

      <div className="space-y-4">
        {(announcements ?? []).map((ann: any) => {
          const pc = priorityConfig[ann?.priority] ?? priorityConfig.normal
          const PIcon = pc?.icon ?? Info
          return (
            <div key={ann?.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-start gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${pc?.color?.split?.(' ')?.[0] ?? 'bg-slate-50'}`}>
                  <PIcon className={`h-5 w-5 ${pc?.color?.split?.(' ')?.[1] ?? 'text-slate-600'}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{ann?.title ?? '-'}</h3>
                  <p className="text-sm text-slate-600 mt-2 whitespace-pre-wrap">{ann?.content ?? ''}</p>
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium mt-3 ${pc?.color ?? 'bg-slate-100 text-slate-500'}`}>
                    {ann?.priority ?? 'normal'}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
        {(announcements ?? []).length === 0 && (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
            <Megaphone className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No announcements at this time</p>
          </div>
        )}
      </div>
    </div>
  )
}
