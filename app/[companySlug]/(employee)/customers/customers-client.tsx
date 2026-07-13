'use client'

import { useState } from 'react'
import { Users, Search, Building, Home, Truck, Plus, X, Pencil } from 'lucide-react'
import { createCustomer, updateCustomer } from '@/lib/actions/customers'

const typeIcons: Record<string, any> = { residential: Home, commercial: Building, roll_off: Truck }
const typeLabels: Record<string, string> = { residential: 'Residential', commercial: 'Commercial', roll_off: 'Roll-Off' }

interface FormState {
  type: string; name: string; contactName: string; email: string; phone: string;
  address: string; address2: string; city: string; state: string; zipCode: string;
  cityId: string; communityId: string; accountNumber: string; notes: string;
}

const emptyForm: FormState = { type: 'residential', name: '', contactName: '', email: '', phone: '', address: '', address2: '', city: '', state: '', zipCode: '', cityId: '', communityId: '', accountNumber: '', notes: '' }

export function CustomersClient({ customers, companySlug, cities, communities }: { customers: any[]; companySlug: string; cities: any[]; communities: any[] }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const resetForm = () => { setShowForm(false); setEditing(null); setForm(emptyForm); setError('') }
  const startEdit = (c: any) => {
    setEditing(c)
    setForm({ type: c.type, name: c.name, contactName: c.contactName || '', email: c.email || '', phone: c.phone || '', address: c.address || '', address2: c.address2 || '', city: c.city || '', state: c.state || '', zipCode: c.zipCode || '', cityId: c.cityId || '', communityId: c.communityId || '', accountNumber: c.accountNumber || '', notes: c.notes || '' })
    setShowForm(true); setError('')
  }
  const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const filteredCommunities = communities.filter((c: any) => !form.cityId || c.cityId === form.cityId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const result = editing
      ? await updateCustomer(companySlug, editing.id, form)
      : await createCustomer(companySlug, form)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    resetForm()
  }

  const filtered = (customers ?? []).filter((c: any) => {
    const matchesSearch = (c?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c?.accountNumber ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c?.email ?? '').toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || c?.type === typeFilter
    return matchesSearch && matchesType
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Customers</h1>
          <p className="text-sm text-slate-500 mt-1">Manage customer accounts</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
          <Plus className="h-4 w-4" /> Add Customer
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">{editing ? 'Edit Customer' : 'Add Customer'}</h3>
            <button onClick={resetForm} className="p-1 hover:bg-slate-100 rounded"><X className="h-4 w-4" /></button>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Type</label>
                <select value={form.type} onChange={e => updateField('type', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="roll_off">Roll-Off</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Customer Name *</label>
                <input value={form.name} onChange={e => updateField('name', e.target.value)} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Account Number</label>
                <input value={form.accountNumber} onChange={e => updateField('accountNumber', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Contact Name</label>
                <input value={form.contactName} onChange={e => updateField('contactName', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                <input type="email" value={form.email} onChange={e => updateField('email', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                <input value={form.phone} onChange={e => updateField('phone', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Address</label>
                <input value={form.address} onChange={e => updateField('address', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Address 2</label>
                <input value={form.address2} onChange={e => updateField('address2', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
            </div>
            {form.type === 'residential' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">City</label>
                  <select value={form.cityId} onChange={e => { updateField('cityId', e.target.value); updateField('communityId', '') }} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                    <option value="">Select city...</option>
                    {cities.map((c: any) => <option key={c.id} value={c.id}>{c.name}, {c.state}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Community (optional)</label>
                  <select value={form.communityId} onChange={e => updateField('communityId', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
                    <option value="">None</option>
                    {filteredCommunities.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">City</label>
                  <input value={form.city} onChange={e => updateField('city', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">State</label>
                  <input value={form.state} onChange={e => updateField('state', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Zip Code</label>
                  <input value={form.zipCode} onChange={e => updateField('zipCode', e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => updateField('notes', e.target.value)} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Saving...' : editing ? 'Update Customer' : 'Create Customer'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input type="text" placeholder="Search customers..." value={search} onChange={(e: any) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
        </div>
        <select value={typeFilter} onChange={(e: any) => setTypeFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white">
          <option value="all">All Types</option>
          <option value="residential">Residential</option>
          <option value="commercial">Commercial</option>
          <option value="roll_off">Roll-Off</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100">
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Account #</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Location</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-16"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((c: any) => {
              const Icon = typeIcons[c?.type] ?? Users
              return (
                <tr key={c?.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900">{c?.name ?? '-'}</p>
                    {c?.contactName && <p className="text-xs text-slate-400">Contact: {c.contactName}</p>}
                    {c?.email && <p className="text-xs text-slate-400">{c.email}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-600">
                      <Icon className="h-3 w-3" /> {typeLabels[c?.type] ?? c?.type ?? '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-mono">{c?.accountNumber ?? '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600 hidden md:table-cell">
                    {c?.cityRef?.name ?? c?.city ?? '-'}{c?.community?.name ? `, ${c.community.name}` : ''}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c?.isActive ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {c?.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => startEdit(c)} className="p-1.5 hover:bg-slate-100 rounded-md"><Pencil className="h-3.5 w-3.5 text-slate-400" /></button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-sm">No customers found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
