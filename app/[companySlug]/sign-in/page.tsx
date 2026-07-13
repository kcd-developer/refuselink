import { prisma } from '@/lib/db'
import { CompanyNotFound } from '../company-not-found'
import { CompanySignInForm } from './sign-in-form'

export const dynamic = 'force-dynamic'

export default async function CompanySignInPage({ params }: { params: { companySlug: string } }) {
  const company = await prisma.company.findUnique({
    where: { slug: params.companySlug },
    include: { branding: true },
  })

  if (!company) return <CompanyNotFound />

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div
            className="h-14 w-14 rounded-xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: company?.branding?.primaryColor ?? '#1D4ED8' }}
          >
            <span className="text-white font-bold text-xl">{company?.name?.charAt?.(0) ?? 'C'}</span>
          </div>
          <h1 className="font-display text-xl font-semibold text-slate-900 mb-1">{company?.name ?? 'Company'}</h1>
          <p className="text-sm text-slate-500">Sign in to your account</p>
        </div>
        <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
          <CompanySignInForm
            companySlug={company?.slug ?? ''}
            primaryColor={company?.branding?.primaryColor ?? '#1D4ED8'}
          />
        </div>
        {company?.branding?.supportPhone && (
          <p className="text-center text-xs text-slate-400 mt-6">
            Need help? Call {company.branding.supportPhone}
          </p>
        )}
      </div>
    </div>
  )
}
