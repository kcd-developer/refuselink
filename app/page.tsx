import Link from 'next/link'
import { ArrowRight, Truck, Users, Calendar, BarChart3, Shield, Headphones } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-blue-600" />
            <span className="font-display font-bold text-xl text-slate-900">RefuseLink</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/features" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Features</Link>
            <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Pricing</Link>
            <Link href="/contact" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">Contact</Link>
          </nav>
          <Link
            href="/contact"
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Contact Sales
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="font-display text-5xl md:text-6xl font-bold text-slate-900 tracking-tight mb-6">
            Waste Management<br />
            <span className="text-blue-600">Made Simple</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
            The modern platform for waste management companies to manage customers, schedules, tickets, and communications — all in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/contact"
              className="px-8 py-3.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center justify-center gap-2"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/features"
              className="px-8 py-3.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors inline-flex items-center justify-center"
            >
              Explore Features
            </Link>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-slate-900 text-center mb-4 tracking-tight">Everything You Need</h2>
          <p className="text-slate-500 text-center mb-12 max-w-xl mx-auto">Purpose-built tools for residential, commercial, and roll-off waste management operations.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Users, title: 'Customer Management', desc: 'Organize residential, commercial, and roll-off customers with full account management and self-service access.' },
              { icon: Calendar, title: 'Service Scheduling', desc: 'Build weekly, bi-weekly, and monthly schedules. Manage exceptions and holiday adjustments.' },
              { icon: Headphones, title: 'Ticket System', desc: 'Handle service requests with assignment, status tracking, internal notes, and full conversation history.' },
              { icon: BarChart3, title: 'Company Dashboard', desc: 'Real-time overview of operations — ticket volumes, customer counts, and team activity at a glance.' },
              { icon: Shield, title: 'Multi-Tenant Security', desc: 'Complete data isolation between companies. Role-based access control for every feature.' },
              { icon: Truck, title: 'Customer Self-Service', desc: 'Branded experience where customers view schedules, announcements, documents, and submit requests.' },
            ].map((f: any, i: number) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-3xl font-bold text-slate-900 tracking-tight mb-4">Ready to modernize your operations?</h2>
          <p className="text-slate-500 mb-8">Join waste management companies that trust RefuseLink to streamline their daily operations.</p>
          <Link
            href="/contact"
            className="px-8 py-3.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            Request a Demo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            <span className="font-display font-semibold text-slate-900">RefuseLink</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <Link href="/features" className="hover:text-slate-700 transition-colors">Features</Link>
            <Link href="/pricing" className="hover:text-slate-700 transition-colors">Pricing</Link>
            <Link href="/contact" className="hover:text-slate-700 transition-colors">Contact</Link>
          </div>
          <p className="text-sm text-slate-400">© 2024 RefuseLink. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
