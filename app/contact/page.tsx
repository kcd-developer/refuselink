import Link from 'next/link'
import { Truck, Mail, Phone, MapPin } from 'lucide-react'
import { ContactForm } from './contact-form'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-blue-600" />
            <span className="font-display font-bold text-xl text-slate-900">RefuseLink</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/features" className="text-sm font-medium text-slate-600 hover:text-slate-900">Features</Link>
            <Link href="/pricing" className="text-sm font-medium text-slate-600 hover:text-slate-900">Pricing</Link>
            <Link href="/contact" className="text-sm font-medium text-blue-600">Contact</Link>
          </nav>
          <Link href="/contact" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
            Contact Sales
          </Link>
        </div>
      </header>

      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-4xl font-bold text-slate-900 tracking-tight text-center mb-4">Get in Touch</h1>
          <p className="text-slate-500 text-center mb-16 max-w-xl mx-auto">Interested in RefuseLink? Fill out the form and our team will reach out shortly.</p>

          <div className="grid md:grid-cols-5 gap-12">
            <div className="md:col-span-3">
              <ContactForm />
            </div>
            <div className="md:col-span-2 space-y-8">
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span>sales@refuselink.com</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <span>(888) 555-LINK</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span>Kansas City, MO</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
