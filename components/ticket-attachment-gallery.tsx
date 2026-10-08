/* eslint-disable @next/next/no-img-element -- Private signed URLs are short-lived and should bypass the image optimizer cache. */
import { Download, FileImage } from 'lucide-react'

export function TicketAttachmentGallery({ attachments }: { attachments: Array<{ id: string; fileUrl: string; fileName: string; mimeType: string }> }) {
  if (!attachments?.length) return null
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 pl-0 sm:grid-cols-3">
      {attachments.map((attachment) => {
        const previewable = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(attachment.mimeType)
        return <a key={attachment.id} href={attachment.fileUrl} target="_blank" rel="noopener noreferrer" className="group relative aspect-[4/3] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm" title={`Open ${attachment.fileName}`}>
          {previewable
            ? <img src={attachment.fileUrl} alt={attachment.fileName} className="h-full w-full object-cover transition group-hover:scale-[1.03]" />
            : <span className="flex h-full flex-col items-center justify-center p-3 text-center"><FileImage className="h-7 w-7 text-slate-400" /><span className="mt-2 max-w-full truncate text-xs text-slate-600">{attachment.fileName}</span></span>}
          <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950/75 text-white opacity-0 transition group-hover:opacity-100"><Download className="h-3.5 w-3.5" /></span>
        </a>
      })}
    </div>
  )
}
