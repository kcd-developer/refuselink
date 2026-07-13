'use client'

import { FileText, Clock } from 'lucide-react'

export function AuditLogsClient({ logs }: { logs: any[] }) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">Audit Logs</h1>
        <p className="text-sm text-slate-500 mt-1">Track administrative actions across the platform</p>
      </div>

      {(logs ?? []).length === 0 ? (
        <div className="bg-white rounded-xl p-12 shadow-sm border border-slate-200 text-center">
          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No audit logs recorded yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Time</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actor</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Entity</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Company</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {(logs ?? []).map((log: any) => (
                <tr key={log?.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-xs text-slate-500 font-mono whitespace-nowrap">
                    {log?.createdAt ? new Date(log.createdAt).toLocaleString('en-US', { timeZone: 'UTC' }) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-slate-900">{log?.actorName ?? '-'}</div>
                    <div className="text-xs text-slate-400">{log?.actorType ?? ''}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-700">{log?.action ?? '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{log?.entityType ?? '-'}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{log?.company?.name ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
