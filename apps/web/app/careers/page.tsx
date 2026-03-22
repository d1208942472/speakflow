import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Careers — SpeakFlow | Join Our AI-Powered English Coaching Team',
  description: 'Join SpeakFlow — we\'re building AI-powered business English coaching for 1.5 billion non-native professionals. Open roles in AI/ML, mobile engineering, and growth.',
}

const openRoles = [
  {
    title: 'Senior ML Engineer — Speech AI',
    dept: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    desc: 'Build and optimize our NVIDIA Riva ASR pipeline. Improve pronunciation scoring accuracy and latency.',
  },
  {
    title: 'Mobile Engineer (React Native / Expo)',
    dept: 'Engineering',
    location: 'Remote',
    type: 'Full-time',
    desc: 'Own the iOS/Android app. Improve the recording UX, offline support, and real-time audio processing.',
  },
  {
    title: 'Growth & Content Lead',
    dept: 'Marketing',
    location: 'Remote',
    type: 'Full-time',
    desc: 'Drive user acquisition through SEO, content marketing, and partnerships with international professional communities.',
  },
  {
    title: 'Business English Curriculum Designer',
    dept: 'Content',
    location: 'Remote',
    type: 'Contract',
    desc: 'Design conversation scenarios, target phrases, and coaching scripts for business English practice sessions.',
  },
]

const perks = [
  { icon: '🌍', title: 'Remote-first', desc: 'Work from anywhere in the world' },
  { icon: '⚡', title: 'NVIDIA ecosystem', desc: 'Build with cutting-edge AI infrastructure' },
  { icon: '📈', title: 'Early equity', desc: 'Join early and grow with the company' },
  { icon: '🎓', title: 'Learning budget', desc: '$2,000/year for courses and conferences' },
  { icon: '🏥', title: 'Health coverage', desc: 'Full medical, dental, vision (US & global)' },
  { icon: '🎙️', title: 'English coaching', desc: 'Free Pro access for you and your family' },
]

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b border-border/50 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">S</span>
            </div>
            <span className="text-white font-bold text-xl">SpeakFlow</span>
          </Link>
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">
            &larr; Home
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6">
          Help 1.5 Billion People{' '}
          <span className="text-primary">Speak Up</span>
        </h1>
        <p className="text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
          We&rsquo;re a small, fully-remote team building AI-powered business English coaching
          on NVIDIA infrastructure. If you want to make a real dent in language inequality, join us.
        </p>
      </section>

      {/* Perks */}
      <section className="py-12 max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl font-bold text-white mb-6">Why SpeakFlow?</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {perks.map((perk) => (
            <div key={perk.title} className="bg-card border border-border rounded-2xl p-4">
              <div className="text-2xl mb-2">{perk.icon}</div>
              <h3 className="text-white font-semibold text-sm mb-1">{perk.title}</h3>
              <p className="text-slate-400 text-sm">{perk.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Open Roles */}
      <section className="py-12 max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl font-bold text-white mb-6">Open Roles</h2>
        <div className="space-y-4">
          {openRoles.map((role) => (
            <div
              key={role.title}
              className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all duration-200 group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-2">
                  <h3 className="text-white font-bold text-lg group-hover:text-primary transition-colors">
                    {role.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{role.desc}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 rounded-full">
                      {role.dept}
                    </span>
                    <span className="text-xs bg-card border border-border text-slate-400 px-2 py-0.5 rounded-full">
                      {role.location}
                    </span>
                    <span className="text-xs bg-card border border-border text-slate-400 px-2 py-0.5 rounded-full">
                      {role.type}
                    </span>
                  </div>
                </div>
                <a
                  href={`mailto:hello@speakflow.ai?subject=Application: ${encodeURIComponent(role.title)}`}
                  className="flex-shrink-0 bg-primary hover:bg-primary-dark text-white font-bold px-5 py-2 rounded-xl text-sm transition-colors"
                >
                  Apply →
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Don't see a role */}
      <section className="py-12 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-card border border-border/50 rounded-3xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-3">Don&rsquo;t see the right role?</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto text-sm">
            We&rsquo;re always looking for exceptional people. Send us a note about what you do and what excites you about SpeakFlow.
          </p>
          <a
            href="mailto:hello@speakflow.ai?subject=Spontaneous Application"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3 rounded-2xl transition-all duration-200 hover:scale-105"
          >
            Send a note
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 text-center">
        <p className="text-slate-500 text-sm">
          &copy; 2026 SpeakFlow, Inc.{' '}
          <Link href="/privacy" className="text-slate-400 hover:text-white transition-colors">Privacy</Link>
          {' · '}
          <Link href="/terms" className="text-slate-400 hover:text-white transition-colors">Terms</Link>
        </p>
      </footer>
    </main>
  )
}
