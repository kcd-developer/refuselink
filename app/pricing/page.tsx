import Link from 'next/link'
import { Truck, Check, ArrowRight } from 'lucide-react'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function PricingPage() {
  const plans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  })

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-blue-600" />
            <span className="font-display font-bold text-xl text-slate-900">RefuseLink</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/features" className="text-sm font-medium text-slate-600 hover:text-slate-900">Features</Link>
            <Link href="/pricing" className="text-sm font-medium text-blue-600">Pricing</Link>
            <Link href="/contact" className="text-sm font-medium text-slate-600 hover:text-slate-900">Contact</Link>
          </nav>
          <Link href="/contact" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            Contact Sales
          </Link>
        </div>
      </header>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-display text-4xl font-bold text-slate-900 tracking-tight text-center mb-4">Simple, Transparent Pricing</h1>
          <p className="text-slate-500 text-center mb-16 max-w-xl mx-auto">Choose the plan that fits your operation. All plans include core features.</p>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {(plans ?? []).map((plan: any, i: number) => {
              const isPopular = i === 1
              const price = (plan?.monthlyPriceCents ?? 0) / 100
              const features = plan?.features ?? {}
              const featureList = [
                plan?.maxCommunities ? `Up to ${plan.maxCommunities} communities` : 'Unlimited communities',
                plan?.maxCustomers ? `Up to ${(plan.maxCustomers ?? 0).toLocaleString('en-US')} customers` : 'Unlimited customers',
                plan?.maxStaffUsers ? `Up to ${plan.maxStaffUsers} staff users` : 'Unlimited staff users',
                ...(features?.analytics ? ['Advanced analytics'] : []),
                ...(features?.customBranding ? ['Custom branding'] : []),
                ...(features?.apiAccess ? ['API access'] : []),
                ...(features?.whiteLabel ? ['White label'] : []),
                ...(features?.prioritySupport ? ['Priority support'] : []),
              ]

              return (
                <div
                  key={plan?.id ?? i}
                  className={`rounded-xl p-8 ${isPopular ? 'bg-blue-600 text-white ring-2 ring-blue-600 scale-105' : 'bg-slate-50 text-slate-900'}`}
                >
                  {isPopular && <span className="text-xs font-semibold uppercase tracking-wide text-blue-200 mb-2 block">Most Popular</span>}
                  <h3 className="font-display text-xl font-bold mb-2">{plan?.name ?? 'Plan'}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">${price?.toLocaleString?.('en-US') ?? '0'}</span>
                    <span className={`text-sm ${isPopular ? 'text-blue-200' : 'text-slate-500'}`}>/month</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {featureList.map((f: string, j: number) => (
                      <li key={j} className="flex items-start gap-2 text-sm">
                        <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${isPopular ? 'text-blue-200' : 'text-blue-600'}`} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/contact"
                    className={`w-full py-2.5 rounded-lg text-sm font-medium text-center block transition-colors ${
                      isPopular ? 'bg-white text-blue-600 hover:bg-blue-50' : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Get Started
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            <span className="font-display font-semibold text-slate-900">RefuseLink</span>
          </div>
          <p className="text-sm text-slate-400">© 2024 RefuseLink. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
