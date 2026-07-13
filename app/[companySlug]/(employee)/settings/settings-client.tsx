'use client'

import { useState } from 'react'
import { Settings, Save, Palette, Phone, Mail, Globe } from 'lucide-react'
import { updateBranding } from '@/lib/actions/settings'

export function SettingsClient({ company, companySlug }: { company: any; companySlug: string }) {
  const b = company?.branding ?? {}
  const [primaryColor, setPrimaryColor] = useState(b.primaryColor ?? '#0F172A')
  const [secondaryColor, setSecondaryColor] = useState(b.secondaryColor ?? '#3B82F6')
  const [supportPhone, setSupportPhone] = useState(b.supportPhone ?? '')
  const [supportEmail, setSupportEmail] = useState(b.supportEmail ?? '')
  const [website, setWebsite] = useState(b.website ?? '')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true); setMessage('')
    const result = await updateBranding(companySlug, {
      primaryColor, secondaryColor,
      supportPhone: supportPhone || null,
      supportEmail: supportEmail || null,
      website: website || null,
    })
    setSaving(false)
    if (result.error) { setMessage(result.error); return }
    setMessage('Settings saved successfully')
    setTimeout(() => setMessage(''), 3000)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure company branding and contact information</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-1">General</h3>
          <p className="text-sm text-slate-500 mb-4">Company information</p>
          <dl className="space-y-3">
            <div className="flex justify-between text-sm">
              <dt className="text-slate-500">Company Name</dt>
              <dd className="text-slate-900 font-medium">{company?.name ?? '-'}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-slate-500">URL Slug</dt>
              <dd className="text-slate-900 font-mono text-xs">/{company?.slug ?? '-'}</dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-slate-500">Status</dt>
              <dd><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                company?.status === 'active' ? 'bg-green-50 text-green-700' :
                company?.status === 'trial' ? 'bg-blue-50 text-blue-700' :
                'bg-slate-100 text-slate-500'
              }`}>{company?.status ?? '-'}</span></dd>
            </div>
            <div className="flex justify-between text-sm">
              <dt className="text-slate-500">Plan</dt>
              <dd className="text-slate-900 font-medium">{company?.subscription?.plan?.name ?? 'None'}</dd>
            </div>
          </dl>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-1 flex items-center gap-2"><Palette className="h-4 w-4" /> Branding</h3>
          <p className="text-sm text-slate-500 mb-4">Customize your company's appearance</p>
          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${message.includes('error') || message.includes('Invalid') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{message}</div>
          )}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="h-9 w-9 rounded border border-slate-200 cursor-pointer" />
                  <input value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="h-9 w-9 rounded border border-slate-200 cursor-pointer" />
                  <input value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><Phone className="h-3 w-3" /> Support Phone</label>
              <input value={supportPhone} onChange={e => setSupportPhone(e.target.value)} placeholder="(555) 123-4567" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><Mail className="h-3 w-3" /> Support Email</label>
              <input type="email" value={supportEmail} onChange={e => setSupportEmail(e.target.value)} placeholder="support@example.com" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1 flex items-center gap-1"><Globe className="h-3 w-3" /> Website</label>
              <input type="url" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://example.com" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <button type="submit" disabled={saving} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save Branding'}
            </button>
          </div>
        </form>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-900 mb-1">Brand Preview</h3>
          <p className="text-sm text-slate-500 mb-4">How your branding will appear</p>
          <div className="space-y-3">
            <div className="rounded-lg p-4 text-white text-sm font-medium" style={{ backgroundColor: primaryColor }}>Primary Color</div>
            <div className="rounded-lg p-4 text-white text-sm font-medium" style={{ backgroundColor: secondaryColor }}>Secondary Color</div>
            <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200">
              <div className="h-10 w-10 rounded-md flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                <span className="text-white font-bold">{company?.name?.charAt?.(0) ?? 'C'}</span>
              </div>
              <span className="font-semibold text-slate-900">{company?.name ?? 'Company'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
