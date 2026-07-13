import Link from 'next/link'
import {
  Truck, Users, Calendar, Ticket, Megaphone, FileText,
  MapPin, Shield, BarChart3, Settings, ArrowRight, Building
} from 'lucide-react'

export default function FeaturesPage() {
  const features = [
    { icon: Users, title: 'Customer Management', desc: 'Full lifecycle management for residential, commercial, and roll-off customers. Track accounts, contacts, addresses, and service history with detailed profiles.' },
    { icon: Ticket, title: 'Ticket System', desc: 'Complete support workflow with ticket creation, assignment, priority levels, status tracking, internal notes, and message history with file attachments.' },
    { icon: Calendar, title: 'Service Scheduling', desc: 'Define flexible pickup schedules — weekly, bi-weekly, or monthly. Manage holiday exceptions and alternate dates for uninterrupted service.' },
    { icon: Megaphone, title: 'Announcements', desc: 'Communicate schedule changes, new guidelines, and special pickups. Target announcements by customer type, city, or community.' },
    { icon: FileText, title: 'Document Library', desc: 'Share holiday schedules, recycling guides, and service agreements. Target documents to specific customer segments.' },
    { icon: MapPin, title: 'City & Community Management', desc: 'Organize service areas by city and community (HOA, subdivision). Link customers to their geographic areas for targeted communications.' },
    { icon: Shield, title: 'Role-Based Access', desc: 'Five employee roles — Owner, Admin, Manager, CSR, and Dispatcher — each with precisely scoped permissions for secure operations.' },
    { icon: Building, title: 'Multi-Company Platform', desc: 'Each company operates in complete isolation with its own branding, customers, schedules, and employees on a shared platform.' },
    { icon: Truck, title: 'Customer Self-Service', desc: 'Branded customer experience for viewing schedules, reading announcements, downloading documents, and submitting service requests.' },
    { icon: BarChart3, title: 'Operations Dashboard', desc: 'Real-time metrics for ticket volumes, customer counts, and team activity. Quick actions for common tasks keep operations flowing.' },
    { icon: Settings, title: 'Company Branding', desc: 'Customize colors, contact information, and branding to match your company identity across the customer-facing experience.' },
  ]

  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-blue-600" />
            <span className="font-display font-bold text-xl text-slate-900">RefuseLink</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/features" className="text-sm font-medium text-blue-600">Features</Link>
            <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900">Pricing</Link>
            <Link href="/contact" className="text-sm font-medium text-slate-600 hover:text-slate-900">Contact</Link>
          </nav>
          <Link href="/contact" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            Contact Sales
          </Link>
        </div>
      </header>

      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="font-display text-4xl font-bold text-slate-900 tracking-tight text-center mb-4">Platform Features</h1>
          <p className="text-slate-500 text-center mb-16 max-w-xl mx-auto">Everything waste management companies need to operate efficiently and serve customers better.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f: any, i: number) => (
              <div key={i} className="bg-slate-50 rounded-xl p-6 hover:bg-slate-100 transition-colors">
                <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-blue-600">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-2xl font-bold text-white mb-4">Ready to get started?</h2>
          <Link href="/contact" className="px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 inline-flex items-center gap-2">
            Contact Sales <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            <span className="font-display font-semibold text-slate-900">RefuseLink</span>
          </div>
          <p className="text-sm text-slate-400">© 2024 RefuseLink. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
