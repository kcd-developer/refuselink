'use client'

import { useState } from 'react'
import { Users, Shield, Plus, X, Pencil } from 'lucide-react'
import { createPlatformUser, updatePlatformUser } from '@/lib/actions/platform'

const roleLabels: Record<string, string> = {
  platform_owner: 'Owner', platform_admin: 'Admin', platform_support: 'Support', platform_sales: 'Sales'
}

interface FormState { name: string; email: string; role: string; password: string; isActive: boolean }
const emptyForm: FormState = { name: '', email: '', role: 'platform_support', password: '', isActive: true }

export function UsersClient({ users }: { users: any[] }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const resetForm = () => { setShowForm(false); setEditing(null); setForm(emptyForm); setError('') }
  const startEdit = (u: any) => {
    setEditing(u)
    setForm({ name: u.name, email: u.email, role: u.role, password: '', isActive: u.isActive })
    setShowForm(true); setError('')
  }
  const updateField = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const payload = editing
      ? { name: form.name, email: form.email, role: form.role, isActive: form.isActive, ...(form.password ? { password: form.password } : {}) }
      : form
    const result = editing
      ? await updatePlatformUser(editing.id, payload)
      : await createPlatformUser(payload)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    resetForm()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Platform Users</h1>
          <p className="text-sm text-slate-500 mt-1">Manage RefuseLink staff</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" /> Add User
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">{editing ? 'Edit User' : 'Add User'}</h3>
            <button onClick={resetForm} className="p-1 hover:bg-slate-100 rounded"><X className="h-4 w-4" /></button>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Full Name *</label>
                <input value={form.name} onChange={e => updateField('name', e.target.value)} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Role</label>
                <select value={form.role} onChange={e => updateField('role', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                  {Object.entries(roleLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{editing ? 'New Password (leave blank)' : 'Password *'}</label>
                <input type="password" value={form.password} onChange={e => updateField('password', e.target.value)} {...(editing ? {} : { required: true, minLength: 8 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
              {editing && (
                <div className="flex items-end">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={e => updateField('isActive', e.target.checked)} className="rounded border-slate-300" />
                    <span className="text-sm text-slate-700">Active</span>
                  </label>
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {users.map((u: any) => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-slate-900">{u.name}</p>
                  <p className="text-xs text-slate-400">{u.email}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                    <Shield className="h-3 w-3" /> {roleLabels[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {u.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => startEdit(u)} className="p-1.5 hover:bg-slate-100 rounded-md"><Pencil className="h-3.5 w-3.5 text-slate-400" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
