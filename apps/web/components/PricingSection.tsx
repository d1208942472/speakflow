import Link from 'next/link'

const freeFeatures = [
  '3 free lesson scenarios',
  'Job interviews, presentations, and small talk',
  '5 sessions per day',
  'Standard pronunciation feedback',
  'Community leaderboard access',
]

const proFeatures = [
  'All 25+ lesson scenarios',
  'Unlimited daily sessions',
  'NVIDIA Riva real-time scoring',
  'AI Coach Max (Llama 3.1)',
  'Weekly competitive leagues',
  'Streak shields (5/month)',
  'Priority AI processing',
  'Offline lesson access',
  'Progress analytics dashboard',
  'Early access to new scenarios',
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-card/30 via-transparent to-card/30" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16 space-y-4">
          <span className="text-primary text-sm font-semibold uppercase tracking-widest">
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
            Start free. Go Pro when ready.
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            No pressure. The free tier is genuinely useful. But when you&apos;re
            serious about fluency, Pro unlocks everything.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free plan */}
          <div className="flex flex-col p-8 rounded-3xl bg-card border border-border">
            <div className="space-y-2 mb-6">
              <h3 className="text-xl font-bold text-white">Free</h3>
              <p className="text-slate-400 text-sm">Start Speaking</p>
            </div>

            <div className="mb-8">
              <div className="flex items-end gap-2">
                <span className="text-5xl font-extrabold text-white">$0</span>
                <span className="text-slate-400 text-base pb-2">forever</span>
              </div>
            </div>

            <ul className="flex-1 space-y-3 mb-8">
              {freeFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <svg
                    className="w-5 h-5 text-slate-500 flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-slate-300">{feature}</span>
                </li>
              ))}
            </ul>

            <a
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full text-center py-4 px-6 rounded-2xl border-2 border-border hover:border-primary/50 text-white font-bold transition-all duration-200 hover:bg-primary/5"
            >
              Download Free
            </a>
          </div>

          {/* Pro plan (highlighted) */}
          <div className="relative flex flex-col p-8 rounded-3xl bg-gradient-to-br from-primary/15 to-primary/5 border-2 border-primary/50 shadow-glow-purple">
            {/* Popular badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <span className="bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg uppercase tracking-wide">
                Most Popular
              </span>
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-white">Pro</h3>
                <span className="bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-bold px-2.5 py-1 rounded-full">
                  SAVE 49%
                </span>
              </div>
              <p className="text-slate-400 text-sm">Everything, unlimited</p>
            </div>

            <div className="mb-8 space-y-1">
              <div className="flex items-end gap-2">
                <span className="text-5xl font-extrabold text-white">$6.67</span>
                <span className="text-slate-400 text-base pb-2">/month</span>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-slate-400 text-sm">
                  Billed as{' '}
                  <span className="text-white font-bold">$79.99/year</span>
                </p>
                <span className="text-slate-500 text-sm line-through">$155.88</span>
              </div>
              <p className="text-primary text-xs font-medium">
                or $12.99/month on App Store
              </p>
            </div>

            <ul className="flex-1 space-y-3 mb-8">
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3 text-sm">
                  <svg
                    className="w-5 h-5 text-primary flex-shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-slate-200">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="space-y-3">
              <Link
                href="/subscribe"
                className="w-full text-center block py-4 px-6 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold transition-all duration-200 hover:scale-[1.02] shadow-glow-purple"
              >
                Start 7-day Free Trial
              </Link>
              <p className="text-center text-slate-500 text-xs">
                Web annual plan · Cancel anytime · No hidden fees
              </p>
            </div>
          </div>
        </div>

        {/* App store badges */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12">
          <p className="text-slate-500 text-sm">Also available on:</p>
          <div className="flex gap-4">
            <a
              href="https://apps.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#1a1a2e] hover:bg-card-hover border border-border rounded-xl px-4 py-2.5 transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <div className="text-left">
                <p className="text-slate-400 text-xs">Download on the</p>
                <p className="text-white font-semibold text-sm">App Store</p>
              </div>
            </a>
            <a
              href="https://play.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#1a1a2e] hover:bg-card-hover border border-border rounded-xl px-4 py-2.5 transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.18 23.76a2 2 0 01-.93-1.74V1.98a2 2 0 01.93-1.74l.1-.05L13.85 12l-10.57 11.81-.1-.05zM16.9 15.2l-2.55-2.55-10.12 5.7 12.67-3.15zm-2.55-6.75L16.9 5.9l-12.67-3.15 10.12 5.7zm4.02 1.02l-2.4 1.35-2.65-2.66 2.65-2.66 2.4 1.35A1.48 1.48 0 0121.52 12a1.48 1.48 0 01-.75 1.34l.6.13z" />
              </svg>
              <div className="text-left">
                <p className="text-slate-400 text-xs">Get it on</p>
                <p className="text-white font-semibold text-sm">Google Play</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
