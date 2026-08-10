'use client'

import { useState } from 'react'
import { Download, FileUp, Users, Search, Building, Home, Truck, Plus, X } from 'lucide-react'
import { createCustomer, importCustomers, updateCustomer, type CustomerImportRow } from '@/lib/actions/customers'

const typeIcons: Record<string, any> = { residential: Home, commercial: Building, roll_off: Truck }
const typeLabels: Record<string, string> = { residential: 'Residential', commercial: 'Commercial', roll_off: 'Roll-Off' }

interface FormState {
  type: string; name: string; contactName: string; email: string; phone: string;
  address: string; address2: string; city: string; state: string; zipCode: string;
  cityId: string; communityId: string; accountNumber: string; notes: string;
}

const emptyForm: FormState = { type: 'residential', name: '', contactName: '', email: '', phone: '', address: '', address2: '', city: '', state: '', zipCode: '', cityId: '', communityId: '', accountNumber: '', notes: '' }

const headerAliases: Record<string, keyof CustomerImportRow> = {
  type: 'type',
  customertype: 'type',
  name: 'name',
  customer: 'name',
  customername: 'name',
  account: 'accountNumber',
  accountnumber: 'accountNumber',
  accountno: 'accountNumber',
  accountnum: 'accountNumber',
  contact: 'contactName',
  contactname: 'contactName',
  email: 'email',
  emailaddress: 'email',
  phone: 'phone',
  phonenumber: 'phone',
  address: 'address',
  address1: 'address',
  street: 'address',
  streetaddress: 'address',
  address2: 'address2',
  unit: 'address2',
  suite: 'address2',
  city: 'city',
  state: 'state',
  zip: 'zipCode',
  zipcode: 'zipCode',
  postalcode: 'zipCode',
  community: 'community',
  hoa: 'community',
  notes: 'notes',
}

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, '').trim().toLocaleLowerCase().replace(/[\s_-]+/g, '')
}

function parseCsv(text: string) {
  const records: string[][] = []
  let record: string[] = []
  let field = ''
  let quoted = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"'
        index += 1
      } else {
        quoted = !quoted
      }
    } else if (character === ',' && !quoted) {
      record.push(field.trim())
      field = ''
    } else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1
      record.push(field.trim())
      field = ''
      if (record.some(Boolean)) records.push(record)
      record = []
    } else {
      field += character
    }
  }
  record.push(field.trim())
  if (record.some(Boolean)) records.push(record)
  if (quoted) throw new Error('The CSV contains an unclosed quoted value')
  return records
}

function normalizeCustomerType(value: string) {
  const normalized = value.trim().toLocaleLowerCase().replace(/[\s-]+/g, '_')
  if (normalized === 'commercial') return 'commercial'
  if (normalized === 'roll_off' || normalized === 'rolloff') return 'roll_off'
  return 'residential'
}

function assignCsvField(row: CustomerImportRow, header: keyof CustomerImportRow, value: string) {
  switch (header) {
    case 'type':
      row.type = normalizeCustomerType(value)
      break
    case 'name':
      row.name = value
      break
    case 'contactName':
      row.contactName = value
      break
    case 'email':
      row.email = value
      break
    case 'phone':
      row.phone = value
      break
    case 'address':
      row.address = value
      break
    case 'address2':
      row.address2 = value
      break
    case 'city':
      row.city = value
      break
    case 'state':
      row.state = value
      break
    case 'zipCode':
      row.zipCode = value
      break
    case 'community':
      row.community = value
      break
    case 'accountNumber':
      row.accountNumber = value
      break
    case 'notes':
      row.notes = value
      break
  }
}

function csvToCustomers(text: string) {
  const records = parseCsv(text)
  if (records.length < 2) throw new Error('The CSV must include a header and at least one customer')
  const mappedHeaders = records[0].map((header) => headerAliases[normalizeHeader(header)] ?? null)
  if (!mappedHeaders.includes('name')) throw new Error('Missing required CSV column: customerName')

  return records.slice(1).map((record) => {
    const row: CustomerImportRow = {
      type: 'residential',
      name: '',
      contactName: '',
      email: '',
      phone: '',
      address: '',
      address2: '',
      city: '',
      state: '',
      zipCode: '',
      community: '',
      accountNumber: '',
      notes: '',
    }
    mappedHeaders.forEach((header, index) => {
      if (!header) return
      assignCsvField(row, header, record[index] ?? '')
    })
    row.type = row.type || 'residential'
    return row
  })
}

export function CustomersClient({ customers, companySlug, cities, communities }: { customers: any[]; companySlug: string; cities: any[]; communities: any[] }) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [formUnlocked, setFormUnlocked] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [importRows, setImportRows] = useState<CustomerImportRow[]>([])
  const [importFileName, setImportFileName] = useState('')
  const [importError, setImportError] = useState('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ created: number; updated: number; skipped: number; addressesCreated: number; citiesCreated: number; errors: string[] } | null>(null)

  const resetForm = () => { setShowForm(false); setEditing(null); setFormUnlocked(false); setForm(emptyForm); setError('') }
  const openCreateForm = () => {
    setShowImport(false)
    resetForm()
    setFormUnlocked(true)
    setShowForm(true)
  }
  const startEdit = (c: any) => {
    setShowImport(false)
    setEditing(c)
    setFormUnlocked(false)
    setForm({ type: c.type, name: c.name, contactName: c.contactName || '', email: c.email || '', phone: c.phone || '', address: c.address || '', address2: c.address2 || '', city: c.city || '', state: c.state || '', zipCode: c.zipCode || '', cityId: c.cityId || '', communityId: c.communityId || '', accountNumber: c.accountNumber || '', notes: c.notes || '' })
    setShowForm(true); setError('')
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }))
  }
  const updateField = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }))

  const filteredCommunities = communities.filter((c: any) => !form.cityId || c.cityId === form.cityId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editing && !formUnlocked) return
    setLoading(true); setError('')
    const result = editing
      ? await updateCustomer(companySlug, editing.id, form)
      : await createCustomer(companySlug, form)
    setLoading(false)
    if (result.error) { setError(result.error); return }
    resetForm()
  }

  const handleFile = async (file?: File) => {
    setImportError('')
    setImportResult(null)
    setImportRows([])
    setImportFileName(file?.name ?? '')
    if (!file) return
    if (!file.name.toLocaleLowerCase().endsWith('.csv')) {
      setImportError('Choose a CSV file')
      return
    }
    try {
      const parsed = csvToCustomers(await file.text())
      if (parsed.length > 1000) throw new Error('Import up to 1,000 customers at a time')
      setImportRows(parsed)
    } catch (fileError) {
      setImportError(fileError instanceof Error ? fileError.message : 'Unable to read the CSV file')
    }
  }

  const handleImport = async () => {
    setImporting(true)
    setImportError('')
    const result = await importCustomers(companySlug, importRows)
    setImporting(false)
    if (!('created' in result)) {
      setImportError(result.error ?? 'Failed to import customers')
      return
    }
    setImportResult({
      created: result.created,
      updated: result.updated,
      skipped: result.skipped,
      addressesCreated: result.addressesCreated,
      citiesCreated: result.citiesCreated,
      errors: result.errors,
    })
    setImportRows([])
    setImportFileName('')
  }

  const downloadTemplate = () => {
    const content = [
      'type,customerName,accountNumber,contactName,email,phone,address,address2,city,state,zipCode,community,notes',
      'residential,David Thompson,KCD-R-001,David Thompson,david@example.com,816-555-0100,123 Oak Street,,Kansas City,MO,64101,Hills of Rock Creek,',
    ].join('\n')
    const url = URL.createObjectURL(new Blob([content], { type: 'text/csv' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'refuselink-customer-import-template.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const filtered = (customers ?? []).filter((c: any) => {
    const linkedUsers = (c?.userAccess ?? []).map((access: any) => access.customerUser)
    const matchesSearch = (c?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c?.accountNumber ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (c?.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      linkedUsers.some((user: any) =>
        (user?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (user?.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (user?.phone ?? '').toLowerCase().includes(search.toLowerCase())
      )
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => { resetForm(); setShowImport((visible) => !visible); setImportError(''); setImportResult(null) }}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50"
          >
            <FileUp className="h-4 w-4" /> Import CSV
          </button>
          <button onClick={openCreateForm} className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
            <Plus className="h-4 w-4" /> Add Customer
          </button>
        </div>
      </div>

      {showImport && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-900">Import Customers</h3>
              <p className="text-sm text-slate-500 mt-1">
                Upload customer accounts in CSV format. Account numbers update existing customers; new addresses are added to the address list.
              </p>
            </div>
            <button onClick={downloadTemplate} className="inline-flex items-center gap-2 px-3 py-2 border border-slate-200 text-sm font-medium rounded-lg hover:bg-slate-50">
              <Download className="h-4 w-4" /> Template
            </button>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">CSV file</label>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(event) => handleFile(event.target.files?.[0])}
                className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200"
              />
            </div>
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || importRows.length === 0}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <FileUp className="h-4 w-4" /> {importing ? 'Importing...' : 'Import Customers'}
            </button>
          </div>
          {importFileName && !importError && importRows.length > 0 && (
            <p className="text-sm text-slate-500 mt-3">{importRows.length} customer row(s) ready from {importFileName}.</p>
          )}
          {importError && <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{importError}</div>}
          {importResult && (
            <div className="mt-4 p-3 bg-green-50 text-green-800 rounded-lg text-sm">
              Imported {importResult.created} new customer(s), updated {importResult.updated}, created {importResult.addressesCreated} address(es), created {importResult.citiesCreated} city record(s), skipped {importResult.skipped}.
              {importResult.errors.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-green-900">
                  {importResult.errors.map((rowError) => <li key={rowError}>{rowError}</li>)}
                </ul>
              )}
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-slate-900">{editing ? formUnlocked ? 'Edit Customer' : 'Customer Details' : 'Add Customer'}</h3>
            <button onClick={resetForm} className="p-1 hover:bg-slate-100 rounded"><X className="h-4 w-4" /></button>
          </div>
          {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <fieldset disabled={Boolean(editing) && !formUnlocked} className="space-y-4 disabled:opacity-75">
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
            </fieldset>
            <div className="flex justify-end">
              <button
                type={editing && !formUnlocked ? 'button' : 'submit'}
                onClick={editing && !formUnlocked ? () => setFormUnlocked(true) : undefined}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Saving...' : editing ? formUnlocked ? 'Update Customer' : 'Edit Customer' : 'Create Customer'}
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
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map((c: any) => {
              const Icon = typeIcons[c?.type] ?? Users
              return (
                <tr
                  key={c?.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => startEdit(c)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      startEdit(c)
                    }
                  }}
                  className="cursor-pointer hover:bg-slate-50 focus:bg-blue-50 focus:outline-none transition-colors"
                  aria-label={`Edit ${c?.name ?? 'customer'}`}
                >
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-900">{c?.name ?? '-'}</p>
                    {c?.contactName && <p className="text-xs text-slate-400">Contact: {c.contactName}</p>}
                    {c?.email && <p className="text-xs text-slate-400">{c.email}</p>}
                    {(c?.userAccess ?? []).length > 0 && (
                      <div className="mt-2 border-l-2 border-blue-100 pl-2">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Portal Access</p>
                        {(c.userAccess ?? []).map((access: any) => (
                          <p key={access.id} className="text-xs text-slate-500">
                            {access.customerUser?.name ?? 'Unknown user'} · {access.customerUser?.email ?? 'No email'}
                          </p>
                        ))}
                      </div>
                    )}
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
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-sm">No customers found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
