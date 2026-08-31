'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function AutoRefresh({ intervalMs = 15000 }: { intervalMs?: number }) {
  const router = useRouter()

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === 'visible' && document.documentElement.dataset.viewSwitching !== 'true') {
        router.refresh()
      }
    }
    const timer = window.setInterval(refresh, intervalMs)
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && document.documentElement.dataset.viewSwitching !== 'true') {
        router.refresh()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [intervalMs, router])

  return null
}
