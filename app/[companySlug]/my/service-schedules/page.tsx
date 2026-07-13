import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { Calendar } from 'lucide-react'

export const dynamic = 'force-dynamic'

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function CustomerSchedulesPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const resolvedParams = await params
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'customer') redirect(`/${resolvedParams.companySlug}/sign-in`)

  const schedules = await prisma.serviceSchedule.findMany({
    where: { companyId: user.companyId ?? '', isActive: true },
    include: { exceptions: { orderBy: { date: 'asc' } } },
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Service Schedule</h1>
        <p className="text-sm text-slate-500 mt-1">View your collection schedule</p>
      </div>

      <div className="space-y-4">
        {(schedules ?? []).map((s: any) => (
          <div key={s?.id} className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-2">{s?.name ?? '-'}</h3>
            {s?.description && <p className="text-sm text-slate-500 mb-4">{s.description}</p>}
            <div className="flex flex-wrap gap-2 mb-3">
              {(s?.daysOfWeek ?? []).map((d: number) => (
                <span key={d} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-lg font-medium">
                  {dayNames[d] ?? d}
                </span>
              ))}
            </div>
            <p className="text-xs text-slate-400 capitalize">{s?.frequency ?? ''} · {s?.type?.replace?.('_', ' ') ?? ''}</p>
            {(s?.exceptions ?? []).length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-2">Upcoming Exceptions</p>
                {(s.exceptions ?? []).map((ex: any) => (
                  <div key={ex?.id} className="text-xs text-slate-600 py-1">
                    {ex?.date ? new Date(ex.date).toLocaleDateString('en-US', { timeZone: 'UTC' }) : '-'}
                    {ex?.reason ? ` — ${ex.reason}` : ''}
                    {ex?.alternateDate ? ` (Alternate: ${new Date(ex.alternateDate).toLocaleDateString('en-US', { timeZone: 'UTC' })})` : ''}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {(schedules ?? []).length === 0 && (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
            <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No schedules available</p>
          </div>
        )}
      </div>
    </div>
  )
}
