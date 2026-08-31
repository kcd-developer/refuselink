'use client'

import { useState } from 'react'
import { User, Save, Lock, Home, Building, Truck, Eye, EyeOff } from 'lucide-react'
import { updateCustomerProfile, updateCustomerPassword } from '@/lib/actions/profile'

const typeIcons: Record<string, any> = { residential: Home, commercial: Building, roll_off: Truck }
const typeLabels: Record<string, string> = { residential: 'Residential', commercial: 'Commercial', roll_off: 'Roll-Off' }

export function ProfileClient({ customerUser, companySlug }: { customerUser: any; companySlug: string }) {
  const [name, setName] = useState(customerUser?.name ?? '')
  const [phone, setPhone] = useState(customerUser?.phone ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMessage, setPwMessage] = useState('')

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setMessage('')
    const result = await updateCustomerProfile(companySlug, { name, phone })
    setSaving(false)
    setMessage(result.error ?? 'Profile updated successfully')
    setTimeout(() => setMessage(''), 3000)
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwSaving(true); setPwMessage('')
    const result = await updateCustomerPassword(companySlug, { currentPassword, newPassword })
    setPwSaving(false)
    setPwMessage(result.error ?? 'Password changed successfully')
    if (result.success) { setCurrentPassword(''); setNewPassword('') }
    setTimeout(() => setPwMessage(''), 3000)
  }

  const accounts = customerUser?.accounts ?? []

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight mb-8">My Profile</h1>

      <form onSubmit={handleSaveProfile} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><User className="h-4 w-4" /> Personal Information</h3>
        {message && <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('error') || message.includes('Unauthorized') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{message}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label>
            <input value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
            <input value={customerUser?.email ?? ''} disabled className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 text-slate-400" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
            <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      <form onSubmit={handleChangePassword} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2"><Lock className="h-4 w-4" /> Change Password</h3>
        {pwMessage && <div className={`mb-4 p-3 rounded-lg text-sm ${pwMessage.includes('incorrect') || pwMessage.includes('error') || pwMessage.includes('must') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{pwMessage}</div>}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Current Password</label>
            <div className="relative">
              <input type={showCurrentPassword ? 'text' : 'password'} value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required autoComplete="current-password" className="w-full py-2 pl-3 pr-11 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              <button type="button" onClick={() => setShowCurrentPassword((current) => !current)} className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label={showCurrentPassword ? 'Hide current password' : 'Show current password'} aria-pressed={showCurrentPassword}>
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">New Password (min 8 characters)</label>
            <div className="relative">
              <input type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} autoComplete="new-password" className="w-full py-2 pl-3 pr-11 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              <button type="button" onClick={() => setShowNewPassword((current) => !current)} className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label={showNewPassword ? 'Hide new password' : 'Show new password'} aria-pressed={showNewPassword}>
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={pwSaving} className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50">
            <Lock className="h-4 w-4" /> {pwSaving ? 'Changing...' : 'Change Password'}
          </button>
        </div>
      </form>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Linked Accounts</h3>
        <div className="space-y-3">
          {accounts.map((acc: any) => {
            const c = acc?.customer
            if (!c) return null
            const Icon = typeIcons[c.type] ?? User
            return (
              <div key={acc.id} className="flex items-center justify-between p-4 rounded-lg border border-slate-100">
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-400">{typeLabels[c.type] ?? c.type} · {c.accountNumber ?? 'No account #'}</p>
                    {c.address && <p className="text-xs text-slate-400">{c.address}{c.cityRef ? `, ${c.cityRef.name}, ${c.cityRef.state}` : ''}</p>}
                  </div>
                </div>
                {acc.isPrimary && <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">Primary</span>}
              </div>
            )
          })}
          {accounts.length === 0 && <p className="text-sm text-slate-400">No linked accounts</p>}
        </div>
      </div>
    </div>
  )
}
