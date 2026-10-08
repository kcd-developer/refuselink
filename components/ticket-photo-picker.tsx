/* eslint-disable @next/next/no-img-element -- Local blob previews cannot use the Next image optimizer. */
'use client'

import { useEffect, useId, useMemo } from 'react'
import { Camera, FileImage, X } from 'lucide-react'
import { MAX_TICKET_PHOTOS } from '@/lib/ticket-attachment-constants'
import { TICKET_PHOTO_ACCEPT, validateTicketPhotos } from '@/lib/ticket-attachments-client'

export function TicketPhotoPicker({
  files,
  onChange,
  onError,
  disabled = false,
}: {
  files: File[]
  onChange: (files: File[]) => void
  onError: (message: string) => void
  disabled?: boolean
}) {
  const inputId = useId()
  const previews = useMemo(() => files.map((file) => ({
    file,
    url: ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) ? URL.createObjectURL(file) : null,
  })), [files])

  useEffect(() => () => previews.forEach((preview) => preview.url && URL.revokeObjectURL(preview.url)), [previews])

  function addFiles(selected: File[]) {
    const next = [...files, ...selected]
    const error = validateTicketPhotos(next)
    if (error) { onError(error); return }
    onError('')
    onChange(next)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-slate-600">Photos <span className="font-normal text-slate-400">(optional)</span></p>
          <p className="mt-0.5 text-xs text-slate-400">Up to {MAX_TICKET_PHOTOS} photos, 10 MB each</p>
        </div>
        <label htmlFor={inputId} className={`inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 ${disabled || files.length >= MAX_TICKET_PHOTOS ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}>
          <Camera className="h-4 w-4" /> Add Photos
        </label>
        <input
          id={inputId}
          type="file"
          accept={TICKET_PHOTO_ACCEPT}
          multiple
          disabled={disabled || files.length >= MAX_TICKET_PHOTOS}
          className="sr-only"
          onChange={(event) => {
            addFiles(Array.from(event.target.files ?? []))
            event.target.value = ''
          }}
        />
      </div>
      {previews.length > 0 && <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
        {previews.map(({ file, url }, index) => (
          <div key={`${file.name}-${file.lastModified}-${index}`} className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
            {url
              ? <img src={url} alt={file.name} className="h-full w-full object-cover" />
              : <div className="flex h-full flex-col items-center justify-center p-2 text-center"><FileImage className="h-6 w-6 text-slate-400" /><span className="mt-1 max-w-full truncate text-[10px] text-slate-500">{file.name}</span></div>}
            <button type="button" onClick={() => onChange(files.filter((_, fileIndex) => fileIndex !== index))} disabled={disabled} className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-950/75 text-white hover:bg-slate-950 disabled:opacity-50" aria-label={`Remove ${file.name}`}><X className="h-3.5 w-3.5" /></button>
          </div>
        ))}
      </div>}
    </div>
  )
}
