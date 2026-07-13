import { prisma } from '@/lib/db'
import { getSession, getSessionUser } from '@/lib/session'
import { redirect } from 'next/navigation'
import { FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function CustomerDocumentsPage({ params }: { params: Promise<{ companySlug: string }> }) {
  const resolvedParams = await params
  const session = await getSession()
  const user = getSessionUser(session)
  if (!user || user.userType !== 'customer') redirect(`/${resolvedParams.companySlug}/sign-in`)

  const documents = await prisma.document.findMany({
    where: { companyId: user.companyId ?? '', isPublished: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Documents</h1>
        <p className="text-sm text-slate-500 mt-1">Access important documents and guides</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(documents ?? []).map((doc: any) => (
          <div key={doc?.id} className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 text-sm truncate">{doc?.title ?? '-'}</p>
                {doc?.description && <p className="text-xs text-slate-500 truncate">{doc.description}</p>}
              </div>
            </div>
            <p className="text-xs text-slate-400">
              {doc?.fileName ?? 'file'} · {doc?.fileSize ? `${(doc.fileSize / 1024).toFixed(0)} KB` : ''}
            </p>
          </div>
        ))}
        {(documents ?? []).length === 0 && (
          <div className="col-span-full bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
            <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No documents available</p>
          </div>
        )}
      </div>
    </div>
  )
}
