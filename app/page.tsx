import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight, BellRing, Building2, CalendarDays, CheckCircle2, ChevronRight,
  ClipboardCheck, FileText, Home, LockKeyhole, Megaphone, MessageSquareText,
  RefreshCw, ShieldCheck, Smartphone, TicketCheck, UserRoundCheck, UsersRound,
} from 'lucide-react'

const residentFeatures = [
  'See upcoming trash, recycling, and yard-waste service days',
  'Receive announcements from KC Disposal and your HOA',
  'Submit and track missed-pickup, cart, recycling, and other service requests',
  'Read responses and continue the conversation in one place',
  'Access helpful documents and community contact information',
  'Manage multiple linked service addresses from one account',
]

const leadershipFeatures = [
  'See community service activity without exposing private resident conversations',
  'Publish announcements directly to residents in your community',
  'Review resident requests and escalate issues to KC Disposal when needed',
  'Send priority suspension and restoration requests for eligible addresses',
  'Track request status and quickly identify suspended addresses',
  'Control which board and management contact details residents can see',
]

const featureCards = [
  { icon: CalendarDays, title: 'Collection schedules', description: 'Residents can see what is being collected, on which day, and whether service follows an A-week, B-week, or weekly schedule.', color: 'bg-blue-50 text-blue-700' },
  { icon: TicketCheck, title: 'Service requests', description: 'Report missed pickups, cart problems, recycling issues, yard waste concerns, delays, illegal dumping, and more—then follow the request through resolution.', color: 'bg-violet-50 text-violet-700' },
  { icon: Megaphone, title: 'Timely announcements', description: 'Keep everyone informed with service notices and community-specific updates from the people residents already trust.', color: 'bg-lime-50 text-lime-700' },
  { icon: ShieldCheck, title: 'HOA service holds', description: 'Authorized HOA leaders can send priority suspension and restoration requests and monitor their progress securely.', color: 'bg-rose-50 text-rose-700' },
  { icon: FileText, title: 'Documents in one place', description: 'Give residents convenient access to published service documents, guides, and other important information.', color: 'bg-amber-50 text-amber-700' },
  { icon: RefreshCw, title: 'Information that stays current', description: 'Responses, announcements, and service-status changes appear automatically across resident and leadership portals.', color: 'bg-cyan-50 text-cyan-700' },
]

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-slate-950">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="RefuseLink home">
            <Image src="/refuselink-logo.png" alt="" width={42} height={42} className="h-10 w-10 rounded-xl" priority />
            <span className="font-display text-xl font-bold tracking-tight">RefuseLink</span>
          </Link>
          <nav className="hidden items-center gap-7 md:flex" aria-label="Main navigation">
            <a href="#features" className="text-sm font-semibold text-slate-600 transition hover:text-blue-700">Features</a>
            <a href="#residents" className="text-sm font-semibold text-slate-600 transition hover:text-blue-700">For Residents</a>
            <a href="#hoa-leaders" className="text-sm font-semibold text-slate-600 transition hover:text-blue-700">For HOA Leaders</a>
            <Link href="/contact" className="text-sm font-semibold text-slate-600 transition hover:text-blue-700">Contact</Link>
          </nav>
          <Link href="/kc-disposal/sign-in" className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">
            Sign In <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      <section className="relative isolate bg-slate-950 px-5 pb-20 pt-16 text-white sm:px-8 sm:pb-28 sm:pt-24">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_78%_18%,rgba(37,99,235,.38),transparent_34%),radial-gradient(circle_at_18%_80%,rgba(132,204,22,.15),transparent_30%)]" />
        <div className="absolute inset-0 -z-10 opacity-20 [background-image:linear-gradient(135deg,transparent_48%,rgba(255,255,255,.13)_49%,transparent_50%)] [background-size:64px_64px]" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.02fr_.98fr]">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-400/10 px-3.5 py-2 text-xs font-bold uppercase tracking-[.14em] text-blue-200">
              <Smartphone className="h-4 w-4" /> Waste service, connected
            </div>
            <h1 className="max-w-3xl font-display text-4xl font-bold leading-[1.08] tracking-[-.035em] sm:text-6xl lg:text-7xl">
              Your community’s waste service, <span className="text-blue-400">all in one place.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300 sm:text-xl">
              RefuseLink connects residents, HOA leaders, community managers, and KC Disposal with schedules, announcements, service requests, and current progress.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/kc-disposal/sign-in" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-blue-950/40 transition hover:bg-blue-500">
                Open RefuseLink <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/10 px-6 py-3.5 font-semibold text-white transition hover:bg-white/15">
                Bring RefuseLink to Your HOA
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-300">
              {['No app store required', 'Works on phones and computers', 'Secure role-based access'].map((item) => (
                <span key={item} className="inline-flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-lime-400" /> {item}</span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:mx-0">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-blue-500/15 blur-2xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white p-3 shadow-2xl shadow-black/40">
              <div className="overflow-hidden rounded-[1.4rem] bg-slate-50 text-slate-950">
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4">
                  <div className="flex items-center gap-2.5"><Image src="/refuselink-logo.png" alt="" width={30} height={30} className="h-8 w-8 rounded-lg" /><span className="font-display text-sm font-bold">KC Disposal</span></div>
                  <BellRing className="h-5 w-5 text-slate-500" />
                </div>
                <div className="p-4 sm:p-5">
                  <div className="relative h-44 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-800 p-5 text-white sm:h-52 sm:p-6">
                    <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(135deg,transparent_48%,white_49%,transparent_50%)] [background-size:48px_48px]" />
                    <p className="relative font-display text-2xl font-bold">Welcome home</p>
                    <p className="relative mt-12 text-[10px] font-bold uppercase tracking-[.18em] text-blue-100 sm:mt-16">Next Service</p>
                    <p className="relative mt-1 font-display text-3xl font-bold">Tuesday</p>
                    <Image src="/images/kc-disposal-recycling-cart-green-lid.png" alt="" width={190} height={190} className="absolute -bottom-8 right-16 h-40 w-40 object-contain drop-shadow-xl sm:h-48 sm:w-48" />
                    <Image src="/images/kc-disposal-trash-cart-black-lid.png" alt="" width={210} height={210} className="absolute -bottom-9 -right-5 h-44 w-44 object-contain drop-shadow-xl sm:h-52 sm:w-52" />
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2.5">
                    {[
                      { icon: TicketCheck, value: '1', label: 'Open Request', color: 'bg-blue-600' },
                      { icon: Megaphone, value: '2', label: 'Updates', color: 'bg-lime-500' },
                      { icon: UserRoundCheck, value: '1', label: 'Linked Address', color: 'bg-blue-600' },
                    ].map((item) => (
                      <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                        <span className={`mb-3 flex h-8 w-8 items-center justify-center rounded-lg text-white ${item.color}`}><item.icon className="h-4 w-4" /></span>
                        <p className="font-display text-xl font-bold">{item.value}</p>
                        <p className="mt-0.5 text-[10px] leading-tight text-slate-500">{item.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-10 gap-y-5 text-sm font-semibold text-slate-500 lg:justify-between">
          <span className="text-slate-900">Built for the whole community</span>
          <span className="inline-flex items-center gap-2"><Home className="h-5 w-5 text-blue-600" /> Residents</span>
          <span className="inline-flex items-center gap-2"><UsersRound className="h-5 w-5 text-blue-600" /> HOA Board Members</span>
          <span className="inline-flex items-center gap-2"><Building2 className="h-5 w-5 text-blue-600" /> Community Managers</span>
          <span className="inline-flex items-center gap-2"><ClipboardCheck className="h-5 w-5 text-blue-600" /> KC Disposal</span>
        </div>
      </section>

      <section id="features" className="scroll-mt-24 bg-slate-50 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-[.16em] text-blue-700">Everything connected</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">Less calling around. More answers.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">RefuseLink puts the information people need—and the tools to take action—into one simple, familiar experience.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featureCards.map((feature) => (
              <article key={feature.title} className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60">
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${feature.color}`}><feature.icon className="h-6 w-6" /></span>
                <h3 className="mt-5 font-display text-lg font-bold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="residents" className="scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
          <div className="rounded-[2rem] bg-blue-50 p-6 sm:p-10">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-5 shadow-sm sm:col-span-2">
                <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white"><CalendarDays className="h-5 w-5" /></span><div><p className="text-xs font-bold uppercase tracking-wider text-slate-400">Next Collection</p><p className="font-display text-lg font-bold sm:text-xl">Tuesday · Trash & Recycling</p></div></div>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm"><MessageSquareText className="h-6 w-6 text-violet-600" /><p className="mt-6 font-display text-lg font-bold">Request received</p><p className="mt-1 text-sm text-slate-500">Follow every update through completion.</p></div>
              <div className="rounded-2xl bg-white p-5 shadow-sm"><Megaphone className="h-6 w-6 text-lime-600" /><p className="mt-6 font-display text-lg font-bold">Community update</p><p className="mt-1 text-sm text-slate-500">Important news is easy to find.</p></div>
            </div>
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[.16em] text-blue-700">For residents</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">Everything about your service, without the guesswork.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">Check the schedule, report a problem, read the latest news, or find an answer—at home or on the go.</p>
            <ul className="mt-8 space-y-4">
              {residentFeatures.map((feature) => <li key={feature} className="flex gap-3 text-slate-700"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" /><span>{feature}</span></li>)}
            </ul>
            <Link href="/kc-disposal/sign-in" className="mt-9 inline-flex items-center gap-2 font-bold text-blue-700 hover:text-blue-800">Resident sign in <ChevronRight className="h-4 w-4" /></Link>
          </div>
        </div>
      </section>

      <section id="hoa-leaders" className="scroll-mt-24 bg-slate-950 px-5 py-20 text-white sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[.95fr_1.05fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.16em] text-lime-400">For HOA leadership</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">A clearer view of what’s happening across your community.</h2>
            <p className="mt-5 text-lg leading-8 text-slate-300">Board members and community managers receive purpose-built tools to communicate, oversee service activity, and work with KC Disposal.</p>
            <Link href="/contact" className="mt-9 inline-flex items-center gap-2 rounded-xl bg-lime-500 px-6 py-3.5 font-bold text-slate-950 transition hover:bg-lime-400">Get RefuseLink for Your HOA <ArrowRight className="h-4 w-4" /></Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {leadershipFeatures.map((feature, index) => (
              <div key={feature} className="rounded-2xl border border-white/10 bg-white/[.06] p-5 backdrop-blur-sm">
                <span className="font-mono text-xs font-bold text-lime-400">0{index + 1}</span>
                <p className="mt-3 leading-6 text-slate-200">{feature}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[.16em] text-blue-700">Simple by design</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">From service address to connected community.</h2>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              { number: '1', icon: UserRoundCheck, title: 'Claim your address', text: 'Create your secure account using an eligible service address in your HOA.' },
              { number: '2', icon: Smartphone, title: 'Open it anywhere', text: 'Use RefuseLink in a web browser or add it to your phone for an app-like experience.' },
              { number: '3', icon: BellRing, title: 'Stay connected', text: 'See schedules, announcements, requests, and updates whenever you need them.' },
            ].map((step) => (
              <div key={step.number} className="relative text-center">
                <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200"><step.icon className="h-7 w-7" /></span>
                <span className="absolute left-[calc(50%+2rem)] top-0 font-mono text-xs font-bold text-blue-600">0{step.number}</span>
                <h3 className="mt-6 font-display text-xl font-bold">{step.title}</h3>
                <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 pb-20 sm:px-8 sm:pb-28">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 to-blue-800 px-6 py-14 text-center text-white shadow-2xl shadow-blue-200 sm:px-12 sm:py-20">
          <div className="absolute inset-0 opacity-15 [background-image:linear-gradient(135deg,transparent_48%,white_49%,transparent_50%)] [background-size:58px_58px]" />
          <div className="relative">
            <LockKeyhole className="mx-auto h-9 w-9 text-blue-200" />
            <h2 className="mx-auto mt-5 max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-5xl">Better communication starts here.</h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-blue-100">Whether you’re a resident looking for your next collection day or an HOA leader supporting an entire neighborhood, RefuseLink keeps everyone connected.</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/kc-disposal/sign-in" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 font-bold text-blue-700 transition hover:bg-blue-50">Sign In to RefuseLink <ArrowRight className="h-4 w-4" /></Link>
              <Link href="/contact" className="inline-flex items-center justify-center rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 font-bold text-white transition hover:bg-white/15">Contact Us</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row">
          <Link href="/" className="flex items-center gap-3"><Image src="/refuselink-logo.png" alt="" width={36} height={36} className="h-9 w-9 rounded-xl" /><span className="font-display text-lg font-bold">RefuseLink</span></Link>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm font-medium text-slate-500">
            <a href="#features" className="hover:text-blue-700">Features</a>
            <a href="#residents" className="hover:text-blue-700">Residents</a>
            <a href="#hoa-leaders" className="hover:text-blue-700">HOA Leaders</a>
            <Link href="/contact" className="hover:text-blue-700">Contact</Link>
          </div>
          <p className="text-sm text-slate-400">© {new Date().getFullYear()} RefuseLink</p>
        </div>
      </footer>
    </main>
  )
}
