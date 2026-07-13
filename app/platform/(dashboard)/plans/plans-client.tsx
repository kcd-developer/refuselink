'use client'

import { useState } from 'react'
import { CreditCard, Plus, X, Check, Pencil } from 'lucide-react'
import { createPlan, updatePlan } from '@/lib/actions/platform'

interface FormState {
  name: string; slug: string; monthlyPriceCents: number; annualPriceCents: number;
  maxCommunities: number | null; maxCustomers: number | null; maxStaffUsers: number | null;
  isActive: boolean; displayOrder: number;
}
const emptyForm: FormState = { name: '', slug: '', monthlyPriceCents: 0, annualPriceCents: 0, maxCommunities: null, maxCustomers: null, maxStaffUsers: null, isActive: true, displayOrder: 0 }

export function PlansClient({ plans }: { plans: any[] }) {
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const resetForm = () => { setShowForm(false); setEditing(null); setForm(emptyForm); setError('') }
  const startEdit = (p: any) => {
    setEditing(p)
    setForm({
      name: p.name, slug: p.slug, monthlyPriceCents: p.monthlyPriceCents, annualPriceCents: p.annualPriceCents,
      maxCommunities: p.maxCommunities, maxCustomers: p.maxCustomers, maxStaffUsers: p.maxStaffUsers,
      isActive: p.isActive, displayOrder: p.displayOrder ?? 0,
    })
    setShowForm(true); setError('')
  }
  const updateField = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError('')
    const result = editing
      ? await updatePlan(editing.id, form)
      : await createPlan(form)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    resetForm()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Plans</h1>
          <p className="text-sm text-slate-500 mt-1">Manage subscription plans</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true) }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-4 w-4" /> Add Plan
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">{editing ? 'Edit Plan' : 'Add Plan'}</h3>
            <button onClick={resetForm} className="p-1 hover:bg-slate-100 rounded"><X className="h-4 w-4" /></button>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Name *</label>
                <input value={form.name} onChange={e => { updateField('name', e.target.value); if (!editing) updateField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')) }} required className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Monthly Price ($)</label>
                <input type="number" value={form.monthlyPriceCents / 100} onChange={e => updateField('monthlyPriceCents', Math.round(parseFloat(e.target.value || '0') * 100))} min={0} step={1} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Annual Price ($)</label>
                <input type="number" value={form.annualPriceCents / 100} onChange={e => updateField('annualPriceCents', Math.round(parseFloat(e.target.value || '0') * 100))} min={0} step={1} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Max Communities (blank=unlimited)</label>
                <input type="number" value={form.maxCommunities ?? ''} onChange={e => updateField('maxCommunities', e.target.value ? parseInt(e.target.value) : null)} min={0} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Max Customers (blank=unlimited)</label>
                <input type="number" value={form.maxCustomers ?? ''} onChange={e => updateField('maxCustomers', e.target.value ? parseInt(e.target.value) : null)} min={0} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Max Staff (blank=unlimited)</label>
                <input type="number" value={form.maxStaffUsers ?? ''} onChange={e => updateField('maxStaffUsers', e.target.value ? parseInt(e.target.value) : null)} min={0} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" />
              </div>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {loading ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((p: any) => (
          <div key={p.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative">
            <button onClick={() => startEdit(p)} className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 rounded-md"><Pencil className="h-3.5 w-3.5 text-slate-400" /></button>
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-5 w-5 text-blue-500" />
              <h3 className="font-semibold text-slate-900">{p.name}</h3>
              {!p.isActive && <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Inactive</span>}
            </div>
            <div className="text-2xl font-bold text-slate-900 mb-1">${(p.monthlyPriceCents / 100).toLocaleString()}<span className="text-sm text-slate-400 font-normal">/mo</span></div>
            <div className="text-sm text-slate-500 mb-4">${(p.annualPriceCents / 100).toLocaleString()}/yr</div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /><span>{p.maxCommunities ?? 'Unlimited'} communities</span></div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /><span>{p.maxCustomers?.toLocaleString() ?? 'Unlimited'} customers</span></div>
              <div className="flex items-center gap-2"><Check className="h-4 w-4 text-green-500" /><span>{p.maxStaffUsers ?? 'Unlimited'} staff users</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
