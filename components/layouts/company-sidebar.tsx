'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import {
  LayoutDashboard, Users, MapPin, Map, Building, Megaphone,
  FileText, Calendar, Ticket, UserCog, Settings, LogOut,
  ChevronLeft, ChevronRight, User
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface CompanySidebarProps {
  companySlug: string
  companyName: string
  primaryColor?: string
}

export function CompanySidebar({ companySlug, companyName, primaryColor }: CompanySidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const { data: session } = useSession() || {}
  const role = session?.user?.role ?? ''

  const navItems = [
    { href: `/${companySlug}/dashboard`, label: 'Dashboard', icon: LayoutDashboard, roles: ['company_owner', 'company_admin', 'company_manager', 'csr', 'dispatcher'] },
    { href: `/${companySlug}/customers`, label: 'Customers', icon: Users, roles: ['company_owner', 'company_admin', 'company_manager', 'csr', 'dispatcher'] },
    { href: `/${companySlug}/addresses`, label: 'Addresses', icon: Map, roles: ['company_owner', 'company_admin', 'company_manager'] },
    { href: `/${companySlug}/cities`, label: 'Cities', icon: MapPin, roles: ['company_owner', 'company_admin', 'company_manager'] },
    { href: `/${companySlug}/communities`, label: 'Communities', icon: Building, roles: ['company_owner', 'company_admin', 'company_manager'] },
    { href: `/${companySlug}/announcements`, label: 'Announcements', icon: Megaphone, roles: ['company_owner', 'company_admin', 'company_manager', 'csr'] },
    { href: `/${companySlug}/documents`, label: 'Documents', icon: FileText, roles: ['company_owner', 'company_admin', 'company_manager', 'csr'] },
    { href: `/${companySlug}/service-schedules`, label: 'Schedules', icon: Calendar, roles: ['company_owner', 'company_admin', 'company_manager', 'dispatcher'] },
    { href: `/${companySlug}/tickets`, label: 'Tickets', icon: Ticket, roles: ['company_owner', 'company_admin', 'company_manager', 'csr', 'dispatcher'] },
    { href: `/${companySlug}/employees`, label: 'Employees', icon: UserCog, roles: ['company_owner', 'company_admin'] },
    { href: `/${companySlug}/settings`, label: 'Settings', icon: Settings, roles: ['company_owner', 'company_admin'] },
    { href: `/${companySlug}/profile`, label: 'My Profile', icon: User, roles: ['company_owner', 'company_admin', 'company_manager', 'csr', 'dispatcher'] },
  ]

  const visibleItems = navItems.filter((item: any) => item.roles.includes(role))

  return (
    <aside className={cn(
      'flex flex-col bg-white border-r border-slate-200 transition-all duration-300 min-h-screen',
      collapsed ? 'w-16' : 'w-64'
    )}>
      <div className="flex items-center justify-between px-4 py-5 border-b border-slate-200">
        {!collapsed && (
          <Link href={`/${companySlug}/dashboard`} className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ backgroundColor: primaryColor ?? '#1D4ED8', boxShadow: 'inset 0 -3px 0 var(--company-secondary)' }}>
              <span className="text-white font-bold text-sm">{companyName?.charAt?.(0) ?? 'C'}</span>
            </div>
            <span className="font-display font-semibold text-slate-900 truncate">{companyName ?? 'Company'}</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-slate-100 transition-colors flex-shrink-0"
        >
          {collapsed ? <ChevronRight className="h-4 w-4 text-slate-500" /> : <ChevronLeft className="h-4 w-4 text-slate-500" />}
        </button>
      </div>

      <nav className="flex-1 px-2 py-4 space-y-1">
        {visibleItems.map((item: any) => {
          const isActive = pathname === item.href || (item.href !== `/${companySlug}/dashboard` && pathname?.startsWith(item.href))
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'text-white'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
              style={isActive ? { backgroundColor: primaryColor ?? '#1D4ED8' } : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" style={!isActive ? { color: 'var(--company-secondary)' } : undefined} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="p-2 border-t border-slate-200">
        <button
          onClick={() => signOut({ callbackUrl: `/${companySlug}/sign-in` })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-colors w-full"
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  )
}
