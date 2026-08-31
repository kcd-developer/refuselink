'use client'

import { useEffect, useRef, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { usePathname, useSearchParams } from 'next/navigation'

export function NavigationLoadingOverlay() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const safetyTimer = useRef<number | null>(null)
  const routeKey = `${pathname}?${searchParams.toString()}`

  useEffect(() => {
    setLoading(false)
    if (safetyTimer.current) window.clearTimeout(safetyTimer.current)
  }, [routeKey])

  useEffect(() => {
    const startLoading = () => {
      setLoading(true)
      if (safetyTimer.current) window.clearTimeout(safetyTimer.current)
      safetyTimer.current = window.setTimeout(() => setLoading(false), 20000)
    }

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest<HTMLAnchorElement>('a[href]')
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return

      const destination = new URL(anchor.href, window.location.href)
      if (destination.origin !== window.location.origin) return
      if (destination.pathname === window.location.pathname && destination.search === window.location.search) return

      startLoading()
    }
    const onPageShow = () => setLoading(false)

    document.addEventListener('click', onClick, true)
    window.addEventListener('pageshow', onPageShow)
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener('pageshow', onPageShow)
      if (safetyTimer.current) window.clearTimeout(safetyTimer.current)
    }
  }, [])

  if (!loading) return null

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-50/65 backdrop-blur-[2px]" role="status" aria-live="polite" aria-label="Loading page">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-xl">
        <LoaderCircle className="h-7 w-7 animate-spin text-blue-600" aria-hidden="true" />
      </div>
      <span className="sr-only">Loading page</span>
    </div>
  )
}
