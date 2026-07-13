import { Settings } from 'lucide-react'

export default function PlatformSettingsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Platform Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Configure global platform settings</p>
      </div>
      <div className="bg-white rounded-xl p-8 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="h-5 w-5 text-slate-400" />
          <h3 className="font-semibold text-slate-900">General Settings</h3>
        </div>
        <p className="text-sm text-slate-500">Platform settings and configuration options will be available here in future updates.</p>
      </div>
    </div>
  )
}
