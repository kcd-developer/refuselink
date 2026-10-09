import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { prisma } from '@/lib/db'
import { InstallGuide } from './install-guide'

export const dynamic = 'force-dynamic'

export default async function InstallPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const { companySlug } = await params
  const company = await prisma.company.findUnique({ where: { slug: companySlug }, select: { name: true } })

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link href={`/${companySlug}/sign-in`} className="flex items-center gap-2.5"><Image src="/refuselink-logo.png" alt="" width={34} height={34} className="h-9 w-9 rounded-lg" priority /><span className="font-display font-bold text-slate-950">{company?.name ?? 'RefuseLink'}</span></Link>
          <Link href={`/${companySlug}/sign-in`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-700"><ArrowLeft className="h-4 w-4" /> Back to sign in</Link>
        </div>
      </header>
      <InstallGuide />
    </div>
  )
}
