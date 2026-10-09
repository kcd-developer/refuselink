'use client'

import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Download, Monitor, Share2, Smartphone } from 'lucide-react'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const guides = [
  {
    id: 'iphone',
    icon: Smartphone,
    eyebrow: 'iPhone or iPad',
    title: 'Install with Safari',
    note: 'Use Safari for the most reliable iPhone and iPad installation.',
    steps: [
      'Open your RefuseLink portal in Safari and sign in.',
      'Tap the Share button (the square with an upward arrow).',
      'Scroll down and tap Add to Home Screen. If it is missing, tap Edit Actions and add it.',
      'Turn on Open as Web App if that option appears, then tap Add.',
      'Open RefuseLink from the new KC Disposal icon on your Home Screen.',
    ],
  },
  {
    id: 'android',
    icon: Smartphone,
    eyebrow: 'Android phone or tablet',
    title: 'Install with Chrome',
    note: 'Menu wording can vary slightly by phone and Chrome version.',
    steps: [
      'Open your RefuseLink portal in Chrome and sign in.',
      'Tap the three-dot menu beside the address bar.',
      'Tap Install app, or tap Add to Home screen and then Install.',
      'Follow the confirmation shown by your phone.',
      'Open RefuseLink from the KC Disposal icon on your Home Screen or app list.',
    ],
  },
  {
    id: 'windows',
    icon: Monitor,
    eyebrow: 'Windows or Chromebook',
    title: 'Install with Chrome or Edge',
    note: 'The app can be pinned to your taskbar or Start menu after installation.',
    steps: [
      'Open your RefuseLink portal in Chrome or Microsoft Edge and sign in.',
      'If an Install icon appears at the right side of the address bar, select it.',
      'In Chrome, you can also choose the three-dot menu → Cast, save and share → Install page as app.',
      'In Edge, choose the three-dot menu → Apps → Install this site as an app.',
      'Select Install and choose any pinning options you want.',
    ],
  },
  {
    id: 'mac',
    icon: Monitor,
    eyebrow: 'Mac',
    title: 'Install with Safari or Chrome',
    note: 'Safari web apps require macOS Sonoma 14 or later.',
    steps: [
      'Open your RefuseLink portal and sign in.',
      'Safari: choose File → Add to Dock, or Share → Add to Dock, and then click Add.',
      'Chrome: select the Install icon in the address bar, or choose the three-dot menu → Cast, save and share → Install page as app.',
      'Open RefuseLink from the Dock, Applications, Launchpad, or Spotlight.',
    ],
  },
]

function detectDevice() {
  if (typeof navigator === 'undefined') return ''
  const ua = navigator.userAgent
  if (/iPad|iPhone|iPod/.test(ua)) return 'iphone'
  if (/Android/.test(ua)) return 'android'
  if (/Macintosh|Mac OS X/.test(ua)) return 'mac'
  return 'windows'
}

export function InstallGuide() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null)
  const [installed, setInstalled] = useState(false)
  const recommended = useMemo(detectDevice, [])

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    setInstalled(isStandalone)
    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setInstallPrompt(event as InstallPromptEvent)
    }
    const onInstalled = () => { setInstalled(true); setInstallPrompt(null) }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const beginInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const choice = await installPrompt.userChoice
    if (choice.outcome === 'accepted') setInstallPrompt(null)
  }

  return (
    <>
      <section className="border-b border-slate-200 bg-gradient-to-br from-slate-950 via-blue-950 to-blue-800 px-5 py-16 text-white sm:px-8 sm:py-20">
        <div className="mx-auto max-w-5xl text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20"><Download className="h-8 w-8" /></span>
          <h1 className="mt-6 font-display text-4xl font-bold tracking-tight sm:text-5xl">Install RefuseLink</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-blue-100">Add KC Disposal to your phone, tablet, or computer for quick access—no app store required.</p>
          {installed ? (
            <div className="mx-auto mt-7 inline-flex items-center gap-2 rounded-full bg-emerald-400/15 px-4 py-2 text-sm font-semibold text-emerald-100 ring-1 ring-emerald-300/30"><CheckCircle2 className="h-4 w-4" /> RefuseLink is already open as an installed app</div>
          ) : installPrompt ? (
            <button onClick={beginInstall} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-blue-800 shadow-lg transition hover:bg-blue-50"><Download className="h-5 w-5" /> Install RefuseLink now</button>
          ) : (
            <p className="mx-auto mt-7 max-w-xl rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm text-blue-50">Choose your device below and follow the steps. Keep this page open while you install.</p>
          )}
        </div>
      </section>

      <main className="bg-slate-50 px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm leading-6 text-blue-950">
            <p className="font-bold">Before you begin</p>
            <p className="mt-1">Open RefuseLink in the browser named in the instructions. Private or Incognito windows may hide the installation option. Installing creates an app icon; it does not create a second account, and your usual login still works.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {guides.map((guide) => {
              const Icon = guide.icon
              const isRecommended = guide.id === recommended
              return (
                <section key={guide.id} id={guide.id} className={`scroll-mt-24 rounded-2xl border bg-white p-6 shadow-sm ${isRecommended ? 'border-blue-400 ring-4 ring-blue-100' : 'border-slate-200'}`}>
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700"><Icon className="h-5 w-5" /></span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-xs font-bold uppercase tracking-[.14em] text-blue-700">{guide.eyebrow}</p>
                        {isRecommended && <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">Your device</span>}
                      </div>
                      <h2 className="mt-1 font-display text-xl font-bold text-slate-950">{guide.title}</h2>
                    </div>
                  </div>
                  <ol className="mt-6 space-y-4">
                    {guide.steps.map((step, index) => (
                      <li key={step} className="flex gap-3 text-sm leading-6 text-slate-700"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">{index + 1}</span><span>{step}</span></li>
                    ))}
                  </ol>
                  <p className="mt-6 border-t border-slate-100 pt-4 text-xs leading-5 text-slate-500">{guide.note}</p>
                </section>
              )
            })}
          </div>

          <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start gap-3"><Share2 className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><h2 className="font-display text-lg font-bold text-amber-950">Don’t see an Install option?</h2><ul className="mt-3 space-y-2 text-sm leading-6 text-amber-950"><li>• Make sure you opened the KC Disposal portal—not a link inside Facebook, Gmail, or another app’s built-in browser.</li><li>• On iPhone or iPad, copy the link and open it directly in Safari.</li><li>• On Android, Windows, or Chromebook, try the latest version of Chrome. On Windows, Edge also works.</li><li>• On Mac, use Safari on macOS Sonoma 14 or later, or use Chrome.</li><li>• If the KC Disposal icon is already on your Home Screen, Dock, Start menu, or app list, RefuseLink may already be installed.</li></ul></div></div>
          </section>
        </div>
      </main>
    </>
  )
}
