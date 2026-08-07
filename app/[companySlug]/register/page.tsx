import { prisma } from '@/lib/db'
import { CompanyNotFound } from '../company-not-found'
import { CompanyRegisterForm } from './register-form'

export const dynamic = 'force-dynamic'

export default async function CompanyRegisterPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const resolvedParams = await params
  const company = await prisma.company.findUnique({
    where: { slug: resolvedParams.companySlug },
    include: { branding: true },
  })

  if (!company || company.status === 'suspended' || company.status === 'cancelled') return <CompanyNotFound />

  const primaryColor = company.branding?.primaryColor ?? '#1D4ED8'

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div
            className="h-14 w-14 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: primaryColor }}
          >
            <span className="text-white font-bold text-xl">{company.name.charAt(0)}</span>
          </div>
          <h1 className="font-display text-2xl font-semibold text-slate-900 mb-1">Claim your service address</h1>
          <p className="text-sm text-slate-500">Create your {company.name} customer portal login.</p>
        </div>
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
          <CompanyRegisterForm companySlug={company.slug} primaryColor={primaryColor} />
        </div>
        {company.branding?.supportPhone && (
          <p className="text-center text-xs text-slate-400 mt-6">
            Need help? Call {company.branding.supportPhone}
          </p>
        )}
      </div>
    </div>
  )
}
