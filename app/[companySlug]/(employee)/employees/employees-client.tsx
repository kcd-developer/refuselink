'use client'

import { useState } from 'react'
import { Users, Plus, X, Pencil, Shield } from 'lucide-react'
import { createEmployee, updateEmployee } from '@/lib/actions/employees'

const roleLabels: Record<string, string> = {
  company_owner: 'Owner', company_admin: 'Admin', company_manager: 'Manager', csr: 'CSR', dispatcher: 'Dispatcher'
}

interface FormState { name: string; email: string; role: string; password: string; isActive: boolean }
const emptyForm: FormState = { name: '', email: '', role: 'csr', password: '', isActive: true }

export function EmployeesClient({ employees, companySlug, currentUserRole }: { employees: any[]; companySlug: string; currentUserRole: string }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const resetForm = () => { setShowForm(false); setEditing(null); setForm(emptyForm); setError('') }
  const startEdit = (emp: any) => {
    setEditing(emp)
    setForm({ name: emp.name, email: emp.email, role: emp.role, password: '', isActive: emp.isActive })
    setShowForm(true); setError('')
  }
  const updateField = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const payload = editing
      ? { name: form.name, email: form.email, role: form.role, isActive: form.isActive, ...(form.password ? { password: form.password } : {}) }
      : { ...form }
    const result = editing
      ? await updateEmployee(companySlug, editing.id, payload)
      : await createEmployee(companySlug, payload)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    resetForm()
  }

  const availableRoles = currentUserRole === 'company_owner'
    ? ['company_owner', 'company_admin', 'company_manager', 'csr', 'dispatcher']
    : ['company_admin', 'company_manager', 'csr', 'dispatcher']

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Employees</h1>
          <p className="text-sm text-slate-500 mt-1">Manage company staff</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
          <Plus className="h-4 w-4" /> Add Employee
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">{editing ? 'Edit Employee' : 'Add Employee'}</h3>
            <button onClick={resetForm} className="p-1 hover:bg-slate-100 rounded"><X className="h-4 w-4" /></button>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Full Name *</label>
                <input value={form.name} onChange={e => updateField('name', e.target.value)} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Role *</label>
                <select value={form.role} onChange={e => updateField('role', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                  {availableRoles.map(r => <option key={r} value={r}>{roleLabels[r] ?? r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                <input type="password" value={form.password} onChange={e => updateField('password', e.target.value)} {...(editing ? {} : { required: true, minLength: 8 })} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
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
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Employee</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Role</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {employees.map((emp: any) => (
              <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="text-sm font-medium text-slate-900">{emp.name}</p>
                  <p className="text-xs text-slate-400">{emp.email}</p>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                    <Shield className="h-3 w-3" /> {roleLabels[emp.role] ?? emp.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${emp.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {emp.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button onClick={() => startEdit(emp)} className="p-1.5 hover:bg-slate-100 rounded-md"><Pencil className="h-3.5 w-3.5 text-slate-400" /></button>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 text-sm">No employees</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
