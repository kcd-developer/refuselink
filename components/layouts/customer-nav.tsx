'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, User, Megaphone, FileText, Calendar,
  Ticket, LogOut, Menu, X
} from 'lucide-react'
import { Building2 } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface CustomerNavProps {
  companySlug: string
  companyName: string
  primaryColor?: string
  userName?: string
  hasCommunityAccess?: boolean
}

export function CustomerNav({ companySlug, companyName, primaryColor, userName, hasCommunityAccess }: CustomerNavProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const color = primaryColor ?? '#1D4ED8'

  const navItems = [
    { href: `/${companySlug}/my`, label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: `/${companySlug}/my/announcements`, label: 'Announcements', icon: Megaphone },
    { href: `/${companySlug}/my/documents`, label: 'Documents', icon: FileText },
    { href: `/${companySlug}/my/service-schedules`, label: 'Schedule', icon: Calendar },
    ...(hasCommunityAccess ? [{ href: `/${companySlug}/my/community`, label: 'Community', icon: Building2 }] : []),
    { href: `/${companySlug}/my/tickets`, label: 'Tickets', icon: Ticket },
    { href: `/${companySlug}/my/profile`, label: 'Profile', icon: User },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-5 h-16 flex items-center gap-6">
          <Link href={`/${companySlug}/my`} className="flex w-48 shrink-0 items-center gap-2 min-w-0">
            <div className="h-8 w-8 shrink-0 rounded-md flex items-center justify-center" style={{ backgroundColor: color, boxShadow: 'inset 0 -3px 0 var(--company-secondary)' }}>
              <span className="text-white font-bold text-sm">{companyName?.charAt?.(0) ?? 'C'}</span>
            </div>
            <span className="font-display font-semibold text-slate-900 hidden sm:inline leading-tight truncate">{companyName ?? 'Company'}</span>
          </Link>

          <nav className="hidden lg:flex flex-1 items-center justify-center gap-1">
            {navItems.map((item: any) => {
              const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                    isActive ? 'text-white' : 'text-slate-600 hover:bg-slate-50'
                  )}
                  style={isActive ? { backgroundColor: color } : undefined}
                >
                  <item.icon className="h-4 w-4" style={!isActive ? { color: 'var(--company-secondary)' } : undefined} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="ml-auto flex min-w-0 items-center justify-end gap-3">
            <div className="hidden md:flex min-w-0 flex-col items-end leading-tight">
              <span className="max-w-36 truncate text-sm font-medium text-slate-900">{userName ?? 'Customer'}</span>
              <span className="text-xs text-slate-500">Customer</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: `/${companySlug}/sign-in` })}
              className="hidden md:inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-slate-100"
              aria-label="Open menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden bg-white border-t border-slate-100 px-4 py-3 space-y-1">
            {navItems.map((item: any) => {
              const isActive = item.exact ? pathname === item.href : pathname?.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                    isActive ? 'text-white' : 'text-slate-600 hover:bg-slate-50'
                  )}
                  style={isActive ? { backgroundColor: color } : undefined}
                >
                  <item.icon className="h-5 w-5" style={!isActive ? { color: 'var(--company-secondary)' } : undefined} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
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
    </>
  )
}
