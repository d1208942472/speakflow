import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy — SpeakFlow',
  description: 'SpeakFlow\'s cookie policy. Learn how we use cookies and how to control your preferences.',
}

export default function CookiesPage() {
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

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <h1 className="text-3xl font-extrabold text-white mb-2">Cookie Policy</h1>
        <p className="text-slate-400 text-sm mb-10">Effective date: January 1, 2026</p>

        <div className="prose prose-invert max-w-none space-y-8 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">What Are Cookies?</h2>
            <p>
              Cookies are small text files placed on your device when you visit our website.
              They help us provide a better experience by remembering your preferences and analyzing how our site is used.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Cookies We Use</h2>
            <div className="space-y-4">
              {[
                {
                  type: 'Essential Cookies',
                  desc: 'Required for the website to function. These cannot be disabled. They include session management, Stripe checkout security tokens, and Supabase authentication.',
                },
                {
                  type: 'Analytics Cookies',
                  desc: 'Help us understand how visitors use our site (page views, session duration, referral sources). We use Vercel Analytics — no personal data is shared with third parties.',
                },
                {
                  type: 'Preference Cookies',
                  desc: 'Remember your language settings and UI preferences across visits.',
                },
              ].map((item) => (
                <div key={item.type} className="bg-card border border-border rounded-2xl p-4">
                  <h3 className="text-white font-semibold mb-1">{item.type}</h3>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Third-Party Cookies</h2>
            <p>
              Our payment provider Stripe may set cookies for fraud prevention and checkout functionality.
              These are governed by{' '}
              <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-light">
                Stripe&rsquo;s Privacy Policy
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Controlling Cookies</h2>
            <p>
              You can control cookies through your browser settings. Note that disabling essential cookies
              may prevent checkout and authentication from working correctly.
            </p>
            <p className="mt-3">
              For more information, visit{' '}
              <a href="https://www.allaboutcookies.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary-light">
                allaboutcookies.org
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-white mb-3">Contact</h2>
            <p>
              Questions about our cookie policy? Email us at{' '}
              <a href="mailto:hello@speakflow.ai" className="text-primary hover:text-primary-light">
                hello@speakflow.ai
              </a>
              {' '}or see our full{' '}
              <Link href="/privacy" className="text-primary hover:text-primary-light">
                Privacy Policy
              </Link>.
            </p>
          </section>
        </div>
      </div>

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
