import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { Calendar } from 'lucide-react'
import { getCustomerAddressServices } from '@/lib/customer-address-services'
import Image from 'next/image'

export const dynamic = 'force-dynamic'

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default async function CustomerSchedulesPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const resolvedParams = await params
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'customer') redirect(`/${resolvedParams.companySlug}/sign-in`)

  const access = await prisma.customerUserAccess.findMany({
    where: { customerUserId: user.id, customer: { companyId: user.companyId ?? '' } },
    include: { customer: true },
  })
  const assignments = await getCustomerAddressServices(user.companyId ?? '', access.map((item) => item.customer))
  const serviceLabels: Record<string, string> = { trash: 'Trash', recycling: 'Recycling', yard_waste: 'Yard Waste' }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Service Schedule</h1>
        <p className="text-sm text-slate-500 mt-1">View your collection schedule</p>
      </div>

      <div className="space-y-4">
        {assignments.flatMap((assignment) => assignment.services.map((service) => {
          const serviceImage = service.service === 'trash'
            ? '/images/kc-disposal-trash-cart-clean.png'
            : service.service === 'recycling'
              ? '/images/kc-disposal-recycling-cart-clean.png'
              : service.service === 'yard_waste'
                ? service.containerSize ? '/images/kc-disposal-yard-waste-cart.png' : '/images/yard-waste-bag.png'
                : null

          return (
            <div key={`${assignment.customerId}-${service.service}`} className="overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-5">
                  {serviceImage && (
                    <Image
                      src={serviceImage}
                      alt=""
                      width={110}
                      height={105}
                      className={`hidden shrink-0 object-contain min-[480px]:block ${service.service === 'yard_waste' && !service.containerSize ? 'h-20 w-20' : 'h-24 w-24'}`}
                    />
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-900">{serviceLabels[service.service] ?? service.service}</h3>
                    <p className="mt-1 text-sm text-slate-500">{assignment.address}{assignment.address2 ? `, ${assignment.address2}` : ''}</p>
                    {service.containerSize && <p className="mt-1 text-xs text-slate-500">Container: {service.containerSize}</p>}
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {service.weekCycle === 'a' ? 'A Week Service' : service.weekCycle === 'b' ? 'B Week Service' : 'Weekly Service'}
                    </p>
                  </div>
                </div>
                <span className="rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700">
                  {dayNames[service.dayOfWeek]}
                </span>
              </div>
            </div>
          )
        }))}
        {assignments.every((assignment) => assignment.services.length === 0) && (
          <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
            <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No schedules available</p>
          </div>
        )}
      </div>
    </div>
  )
}
