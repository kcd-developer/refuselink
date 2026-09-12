'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, RotateCcw, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

type DialogTone = 'danger' | 'success' | 'restore' | 'neutral'

const toneStyles: Record<DialogTone, { panel: string; icon: string; button: string }> = {
  danger: {
    panel: 'border-red-200 bg-red-50',
    icon: 'text-red-600',
    button: 'bg-red-600 text-white hover:bg-red-700',
  },
  success: {
    panel: 'border-emerald-200 bg-emerald-50',
    icon: 'text-emerald-600',
    button: 'bg-emerald-600 text-white hover:bg-emerald-700',
  },
  restore: {
    panel: 'border-blue-200 bg-blue-50',
    icon: 'text-blue-600',
    button: 'bg-blue-600 text-white hover:bg-blue-700',
  },
  neutral: {
    panel: 'border-slate-200 bg-slate-50',
    icon: 'text-slate-600',
    button: 'bg-slate-800 text-white hover:bg-slate-900',
  },
}

const toneIcons: Record<DialogTone, ReactNode> = {
  danger: <AlertTriangle className="h-6 w-6" />,
  success: <CheckCircle2 className="h-6 w-6" />,
  restore: <RotateCcw className="h-6 w-6" />,
  neutral: <XCircle className="h-6 w-6" />,
}

export function ServiceHoldActionDialog({
  open,
  onOpenChange,
  title,
  description,
  address,
  noteLabel,
  notePlaceholder,
  confirmLabel,
  tone,
  loading,
  onConfirm,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  address: string
  noteLabel: string
  notePlaceholder: string
  confirmLabel: string
  tone: DialogTone
  loading: boolean
  onConfirm: (note: string) => Promise<void>
}) {
  const [note, setNote] = useState('')
  const styles = toneStyles[tone]

  useEffect(() => {
    if (open) setNote('')
  }, [open])

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !loading && onOpenChange(nextOpen)}>
      <DialogContent className="w-[calc(100%-2rem)] overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-2xl sm:max-w-md">
        <div className={cn('border-b px-6 py-5', styles.panel)}>
          <div className={cn('mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm', styles.icon)}>
            {toneIcons[tone]}
          </div>
          <DialogHeader className="text-left">
            <DialogTitle className="font-display text-xl text-slate-950">{title}</DialogTitle>
            <DialogDescription className="leading-6 text-slate-600">{description}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Address</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{address}</p>
          </div>

          <div>
            <label htmlFor="service-hold-note" className="mb-2 block text-sm font-semibold text-slate-800">
              {noteLabel} <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <Textarea
              id="service-hold-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={notePlaceholder}
              className="min-h-24 resize-none border-slate-200 bg-white"
              disabled={loading}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:space-x-0">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" className={styles.button} loading={loading} onClick={() => void onConfirm(note.trim())}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
