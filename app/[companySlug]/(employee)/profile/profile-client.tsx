'use client'

import { useState } from 'react'
import { Lock, Save, User } from 'lucide-react'
import { updateEmployeePassword } from '@/lib/actions/employee-profile'

const roleLabels: Record<string, string> = {
  company_owner: 'Owner',
  company_admin: 'Admin',
  company_manager: 'Manager',
  csr: 'CSR',
  dispatcher: 'Dispatcher',
}

export function EmployeeProfileClient({
  companySlug,
  user,
}: {
  companySlug: string
  user: { name: string; email: string; role?: string }
}) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handlePasswordChange = async (event: React.FormEvent) => {
    event.preventDefault()
    setMessage('')

    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match')
      return
    }

    setSaving(true)
    const result = await updateEmployeePassword(companySlug, {
      currentPassword,
      newPassword,
    })
    setSaving(false)

    if (result.error) {
      setMessage(result.error)
      return
    }

    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setMessage('Password updated successfully')
  }

  const isError = message && !message.includes('successfully')

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">My Profile</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your employee account.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
            <User className="h-4 w-4" /> Account
          </h3>
          <p className="text-sm text-slate-500 mb-4">Your company employee profile.</p>
          <dl className="space-y-3">
            <div className="flex justify-between gap-4 text-sm">
              <dt className="text-slate-500">Name</dt>
              <dd className="text-right text-slate-900 font-medium">{user.name}</dd>
            </div>
            <div className="flex justify-between gap-4 text-sm">
              <dt className="text-slate-500">Email</dt>
              <dd className="text-right text-slate-900 font-medium">{user.email}</dd>
            </div>
            <div className="flex justify-between gap-4 text-sm">
              <dt className="text-slate-500">Role</dt>
              <dd className="text-right text-slate-900 font-medium">
                {roleLabels[user.role ?? ''] ?? user.role ?? '-'}
              </dd>
            </div>
          </dl>
        </section>

        <form onSubmit={handlePasswordChange} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2">
            <Lock className="h-4 w-4" /> Change Password
          </h3>
          <p className="text-sm text-slate-500 mb-4">Use your current password to choose a new one.</p>

          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${isError ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {message}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={event => setCurrentPassword(event.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={event => setNewPassword(event.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={event => setConfirmPassword(event.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
