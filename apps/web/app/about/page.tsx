import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About SpeakFlow — AI Business English Coach | NVIDIA-Powered',
  description: 'Learn about SpeakFlow — the AI-powered business English speaking coach built on NVIDIA Riva ASR and Llama 3.1. Our mission: help non-native professionals speak with confidence.',
}

const team = [
  {
    name: 'Max (AI)',
    role: 'Your Personal English Coach',
    bio: 'Powered by NVIDIA NIM and Llama 3.1 70B, Max provides real-time conversation practice with professional grammar and vocabulary feedback.',
    emoji: '🤖',
  },
]

const milestones = [
  { year: '2024', event: 'Founded with a mission to democratize business English coaching' },
  { year: 'Q1 2025', event: 'Integrated NVIDIA Riva ASR for real-time pronunciation scoring' },
  { year: 'Q2 2025', event: 'Launched AI coach Max powered by NVIDIA NIM (Llama 3.1 70B)' },
  { year: 'Q4 2025', event: 'Joined NVIDIA Inception Program' },
  { year: '2026', event: 'Added multilingual support (25 languages) and TTS voice coaching' },
]

export default function AboutPage() {
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
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 bg-hero-glow pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-nvidia/10 border border-nvidia/20 rounded-full px-3 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 bg-nvidia rounded-full" />
            <span className="text-nvidia text-xs font-semibold">NVIDIA Inception Member</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-6 leading-tight">
            Our Mission: Confident English{' '}
            <span className="text-primary">for Everyone</span>
          </h1>
          <p className="text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
            SpeakFlow was built for the 1.5 billion non-native English speakers who work in international environments —
            but never had access to affordable, real-time speaking practice with professional feedback.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-card border border-border rounded-3xl p-8 sm:p-12 space-y-6">
          <h2 className="text-2xl font-bold text-white">The Problem We Solve</h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>
              Language learning apps teach grammar and vocabulary — but they don&rsquo;t teach you how to
              <em> speak</em> in a business meeting, a job interview, or a salary negotiation.
            </p>
            <p>
              Traditional conversation coaches cost $50-150 per hour. Scheduling is a nightmare.
              And they can&rsquo;t give you instant, objective pronunciation scores.
            </p>
            <p>
              SpeakFlow changes this. Using <strong className="text-white">NVIDIA Riva ASR</strong> for
              real-time pronunciation analysis and <strong className="text-white">NVIDIA NIM (Llama 3.1 70B)</strong> for
              AI conversation coaching, we deliver what previously required a human expert — in 3 minutes a day,
              for $6.67/month.
            </p>
          </div>
        </div>
      </section>

      {/* NVIDIA Partnership */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="bg-nvidia/5 border border-nvidia/20 rounded-3xl p-8 sm:p-12 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-nvidia/20 rounded-xl flex items-center justify-center">
              <span className="text-nvidia font-black text-sm">N</span>
            </div>
            <h2 className="text-2xl font-bold text-white">Powered by NVIDIA AI</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { name: 'NVIDIA Riva ASR', desc: 'Real-time speech-to-text with pronunciation scoring at word level' },
              { name: 'NVIDIA NIM — Llama 3.1 70B', desc: 'AI conversation partner with grammar and vocabulary coaching' },
              { name: 'NVIDIA Magpie TTS', desc: "Max's voice — natural text-to-speech for audio coaching feedback" },
              { name: 'NVIDIA Riva Translate', desc: 'Coaching feedback in 12 native languages for global learners' },
            ].map((item) => (
              <div key={item.name} className="bg-card border border-border/50 rounded-2xl p-4">
                <h3 className="text-nvidia font-semibold text-sm mb-1">{item.name}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6">
        <h2 className="text-2xl font-bold text-white mb-8">Our Journey</h2>
        <div className="space-y-4">
          {milestones.map((m) => (
            <div key={m.year} className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-20 text-primary font-bold text-sm pt-0.5">{m.year}</div>
              <div className="flex-1 bg-card border border-border/50 rounded-2xl p-4">
                <p className="text-slate-300 text-sm">{m.event}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Ready to speak with confidence?</h2>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/subscribe"
            className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3 rounded-2xl transition-all duration-200 hover:scale-105"
          >
            Start Free Trial
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 bg-card hover:bg-card-hover border border-border text-white font-medium px-6 py-3 rounded-2xl transition-all duration-200"
          >
            Learn More
          </Link>
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
