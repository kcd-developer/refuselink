'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, User, Megaphone, FileText, Calendar,
  Ticket, LogOut, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface CustomerNavProps {
  companySlug: string
  companyName: string
  primaryColor?: string
  userName?: string
}

export function CustomerNav({ companySlug, companyName, primaryColor, userName }: CustomerNavProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const color = primaryColor ?? '#1D4ED8'

  const navItems = [
    { href: `/${companySlug}/my`, label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { href: `/${companySlug}/my/announcements`, label: 'Announcements', icon: Megaphone },
    { href: `/${companySlug}/my/documents`, label: 'Documents', icon: FileText },
    { href: `/${companySlug}/my/service-schedules`, label: 'Schedule', icon: Calendar },
    { href: `/${companySlug}/my/tickets`, label: 'Tickets', icon: Ticket },
    { href: `/${companySlug}/my/profile`, label: 'Profile', icon: User },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={`/${companySlug}/my`} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md flex items-center justify-center" style={{ backgroundColor: color }}>
              <span className="text-white font-bold text-sm">{companyName?.charAt?.(0) ?? 'C'}</span>
            </div>
            <span className="font-display font-semibold text-slate-900 hidden sm:inline">{companyName ?? 'Company'}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
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
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500 hidden sm:inline">{userName ?? ''}</span>
            <button
              onClick={() => signOut({ callbackUrl: `/${companySlug}/sign-in` })}
              className="hidden md:flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-md hover:bg-slate-100"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 px-4 py-3 space-y-1">
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
                  <item.icon className="h-5 w-5" />
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
