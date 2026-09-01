'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, User, Megaphone, FileText, Calendar,
  Ticket, LogOut, Menu, X, ChevronDown, Check, Settings
} from 'lucide-react'
import { Building2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import type { CustomerViewContext, CustomerViewOption } from '@/lib/customer-view'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface CustomerNavProps {
  companySlug: string
  companyName: string
  primaryColor?: string
  userName?: string
  hasCommunityAccess?: boolean
  viewContext: CustomerViewContext
  unreadRequestCount?: number
  unreadTicketCount?: number
  unreadAnnouncementCount?: number
}

export function CustomerNav({ companySlug, companyName, primaryColor, userName, hasCommunityAccess, viewContext, unreadRequestCount = 0, unreadTicketCount = 0, unreadAnnouncementCount = 0 }: CustomerNavProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [switchingTo, setSwitchingTo] = useState<CustomerViewOption | null>(null)
  const [unreadRequests, setUnreadRequests] = useState(unreadRequestCount)
  const [unreadTickets, setUnreadTickets] = useState(unreadTicketCount)
  const [unreadAnnouncements, setUnreadAnnouncements] = useState(unreadAnnouncementCount)
  const userMenuTriggerRef = useRef<HTMLButtonElement>(null)
  const userMenuOpenedByPointer = useRef(false)
  const isSwitching = Boolean(switchingTo)
  const color = primaryColor ?? '#1D4ED8'

  useEffect(() => {
    const markRead = () => setUnreadRequests(0)
    const markTicketsRead = () => setUnreadTickets(0)
    const markAnnouncementsRead = () => setUnreadAnnouncements(0)
    window.addEventListener('manager-requests-read', markRead)
    window.addEventListener('resident-tickets-read', markTicketsRead)
    window.addEventListener('announcements-read', markAnnouncementsRead)
    return () => {
      window.removeEventListener('manager-requests-read', markRead)
      window.removeEventListener('resident-tickets-read', markTicketsRead)
      window.removeEventListener('announcements-read', markAnnouncementsRead)
    }
  }, [])

  useEffect(() => {
    const updateCounts = async () => {
      if (document.visibilityState !== 'visible') return
      const response = await fetch(`/api/company/${encodeURIComponent(companySlug)}/customer/notification-counts`, { cache: 'no-store' })
      if (!response.ok) return
      const counts = await response.json()
      setUnreadRequests(Number(counts.managerRequests) || 0)
      setUnreadTickets(Number(counts.residentTickets) || 0)
      setUnreadAnnouncements(Number(counts.announcements) || 0)
    }
    const timer = window.setInterval(updateCounts, 15000)
    const onVisibilityChange = () => { if (document.visibilityState === 'visible') void updateCounts() }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onVisibilityChange) }
  }, [companySlug])

  const residentNavItems = [
    { href: `/${companySlug}/my`, label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: `/${companySlug}/my/announcements`, label: 'Announcements', icon: Megaphone, badge: unreadAnnouncements },
    { href: `/${companySlug}/my/documents`, label: 'Documents', icon: FileText },
    { href: `/${companySlug}/my/service-schedules`, label: 'Schedule', icon: Calendar },
    ...(hasCommunityAccess ? [{ href: `/${companySlug}/my/community`, label: 'Community', icon: Building2 }] : []),
    { href: `/${companySlug}/my/tickets`, label: 'Requests', icon: Ticket, badge: unreadTickets },
  ]
  const elevatedNavItems = [
    { href: `/${companySlug}/my/community`, label: viewContext.active.allCommunities ? 'Communities' : 'Community', icon: Building2, exact: true },
    { href: `/${companySlug}/my/announcements`, label: 'Announcements', icon: Megaphone, badge: unreadAnnouncements },
    { href: `/${companySlug}/my/documents`, label: 'Documents', icon: FileText },
    ...(viewContext.active.mode === 'board' ? [{ href: `/${companySlug}/my/community/settings`, label: 'Settings', icon: Settings }] : []),
    ...(viewContext.active.mode === 'manager' ? [{ href: `/${companySlug}/my/managed-tickets`, label: 'Requests', icon: Ticket, badge: unreadRequests }] : []),
  ]
  const navItems = viewContext.active.mode === 'resident' ? residentNavItems : elevatedNavItems

  const handleViewChange = async (option: CustomerViewOption) => {
    if (option.key === viewContext.active.key || isSwitching) return
    setMobileOpen(false)
    setSwitchingTo(option)
    document.documentElement.dataset.viewSwitching = 'true'
    try {
      const response = await fetch(`/api/company/${encodeURIComponent(companySlug)}/customer/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewKey: option.key }),
      })
      if (!response.ok) {
        delete document.documentElement.dataset.viewSwitching
        setSwitchingTo(null)
        return
      }
      const result = await response.json()
      window.location.assign(result.href)
    } catch {
      delete document.documentElement.dataset.viewSwitching
      setSwitchingTo(null)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-5">
          <Link href={`/${companySlug}/my`} className="flex min-w-0 max-w-[calc(100%-3.5rem)] items-center gap-2 min-[1280px]:w-48 min-[1280px]:shrink-0">
            <div className="h-8 w-8 shrink-0 rounded-md flex items-center justify-center" style={{ backgroundColor: color, boxShadow: 'inset 0 -3px 0 var(--company-secondary)' }}>
              <span className="text-white font-bold text-sm">{companyName?.charAt?.(0) ?? 'C'}</span>
            </div>
            <span className="truncate font-display font-semibold leading-tight text-slate-900">{companyName ?? 'Company'}</span>
          </Link>

          <nav className="hidden flex-1 items-center justify-center gap-1 min-[1280px]:flex">
            {navItems.map((item: any) => {
              const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-pressable="true"
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'group flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-sm font-semibold outline-none transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
                    isActive
                      ? 'text-white shadow-[0_8px_18px_-10px_rgba(15,23,42,0.8)]'
                      : 'text-slate-600 hover:-translate-y-px hover:bg-slate-100 hover:text-slate-900'
                  )}
                  style={isActive ? { background: `linear-gradient(135deg, ${color}, #2563EB)` } : undefined}
                >
                  <span
                    className={cn(
                      'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors',
                      isActive ? 'bg-white/15' : 'group-hover:bg-white'
                    )}
                    style={!isActive ? { color: 'var(--company-secondary)', backgroundColor: 'color-mix(in srgb, var(--company-secondary) 12%, transparent)' } : undefined}
                  >
                    <item.icon className="h-4 w-4" />
                  </span>
                  <span>{item.label}</span>
                  {item.badge > 0 && <span className="flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white" aria-label={`${item.badge} unread requests`}>{item.badge > 99 ? '99+' : item.badge}</span>}
                </Link>
              )
            })}
          </nav>

          <div className="ml-auto flex min-w-0 items-center justify-end gap-3">
            <div className="hidden min-[1280px]:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button ref={userMenuTriggerRef} onPointerDown={() => { userMenuOpenedByPointer.current = true }} className="flex max-w-48 items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-slate-900 outline-none transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-blue-500">
                    <span className="truncate">{userName ?? 'Customer'}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  onCloseAutoFocus={(event) => {
                    if (!userMenuOpenedByPointer.current) return
                    event.preventDefault()
                    userMenuTriggerRef.current?.blur()
                    userMenuOpenedByPointer.current = false
                  }}
                  className="w-80 rounded-xl border-slate-200 bg-white p-1.5 shadow-lg"
                >
                  <DropdownMenuLabel className="px-2.5 py-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Viewing As
                  </DropdownMenuLabel>
                  {viewContext.options.map((option) => (
                    <DropdownMenuItem
                      key={option.key}
                      disabled={isSwitching}
                      onSelect={() => handleViewChange(option)}
                      className="cursor-pointer rounded-lg px-2.5 py-2.5 text-slate-700 focus:bg-slate-100 focus:text-slate-900"
                    >
                      {option.mode === 'resident' ? <User className="mr-2 h-4 w-4 shrink-0" /> : <Building2 className="mr-2 h-4 w-4 shrink-0" />}
                      <span className="min-w-0 flex-1 truncate">{option.label}</span>
                      {option.key === viewContext.active.key && <Check className="ml-2 h-4 w-4 shrink-0" style={{ color }} />}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="bg-slate-100" />
                  <DropdownMenuItem asChild className="cursor-pointer rounded-lg px-2.5 py-2 text-slate-700 focus:bg-slate-100 focus:text-slate-900">
                    <Link href={`/${companySlug}/my/profile`}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="cursor-pointer rounded-lg px-2.5 py-2 text-slate-700 focus:bg-slate-100 focus:text-slate-900"
                    onSelect={() => signOut({ callbackUrl: `/${companySlug}/sign-in` })}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-md p-2 hover:bg-slate-100 min-[1280px]:hidden"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="space-y-1 border-t border-slate-100 bg-white px-4 py-3 min-[1280px]:hidden">
            {viewContext.options.length > 1 && (
              <div className="mb-3 rounded-xl bg-slate-50 p-2">
                <p className="px-2 py-1 text-xs font-medium uppercase tracking-wide text-slate-400">Viewing As</p>
                {viewContext.options.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    disabled={isSwitching}
                    onClick={() => handleViewChange(option)}
                    className="flex w-full items-center rounded-lg px-2 py-2 text-left text-sm text-slate-700 hover:bg-white disabled:opacity-60"
                  >
                    {option.mode === 'resident' ? <User className="mr-2 h-4 w-4 shrink-0" /> : <Building2 className="mr-2 h-4 w-4 shrink-0" />}
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                    {option.key === viewContext.active.key && <Check className="ml-2 h-4 w-4 shrink-0" style={{ color }} />}
                  </button>
                ))}
              </div>
            )}
            {navItems.map((item: any) => {
              const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  data-pressable="true"
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                    isActive ? 'text-white' : 'text-slate-600 hover:bg-slate-50'
                  )}
                  style={isActive ? { backgroundColor: color } : undefined}
                >
                  <item.icon className="h-5 w-5" style={!isActive ? { color: 'var(--company-secondary)' } : undefined} />
                  <span>{item.label}</span>
                  {item.badge > 0 && <span className="ml-auto flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">{item.badge > 99 ? '99+' : item.badge}</span>}
                </Link>
              )
            })}
            <Link
              href={`/${companySlug}/my/profile`}
              data-pressable="true"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            >
              <User className="h-5 w-5" style={{ color: 'var(--company-secondary)' }} />
              <span>Profile</span>
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: `/${companySlug}/sign-in` })}
              className="flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium text-slate-500 hover:bg-slate-50 w-full"
            >
              <LogOut className="h-5 w-5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </header>
      {switchingTo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-50/70 backdrop-blur-[2px]" role="status" aria-live="polite">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-xl">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
            <div>
              <p className="text-sm font-semibold text-slate-900">Switching view</p>
              <p className="text-xs text-slate-500">Opening {switchingTo.label}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
