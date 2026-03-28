'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ManageBillingCard } from '../../components/ManageBillingCard'
import { CONTACT_EMAIL, toMailto } from '../../lib/contact'
import { getApiUrl } from '../../lib/api'

const proFeatures = [
  { text: 'All 25+ business English scenarios', icon: '📚' },
  { text: 'Unlimited daily practice sessions', icon: '♾️' },
  { text: 'NVIDIA Riva real-time pronunciation scoring', icon: '🎤' },
  { text: 'AI Coach Max (powered by Llama 3.1)', icon: '🤖' },
  { text: 'Weekly competitive leagues', icon: '🏆' },
  { text: '5 streak shields per month', icon: '🛡️' },
  { text: 'Priority NVIDIA AI processing', icon: '⚡' },
  { text: 'Offline lesson access', icon: '📱' },
  { text: 'Progress analytics dashboard', icon: '📊' },
]

export default function SubscribePage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const webCheckoutEnabled =
    process.env.NEXT_PUBLIC_WEB_CHECKOUT_ENABLED === 'true'

  async function handleCheckout() {
    if (!webCheckoutEnabled) {
      setError('Web checkout is activating. Use the App Store plan for now or email us for founding-member access.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      if (!email.trim()) {
        throw new Error('Enter your email to start checkout')
      }

      const response = await fetch(getApiUrl('/billing/checkout-session'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(
          data.detail || data.error || 'Failed to create checkout session'
        )
      }

      const { url } = await response.json()

      if (url) {
        window.location.href = url
      } else {
        throw new Error('No checkout URL returned')
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-border/50 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">S</span>
            </div>
            <span className="text-white font-bold text-xl">SpeakFlow</span>
          </Link>
          <Link
            href="/"
            className="text-slate-400 hover:text-white text-sm transition-colors"
          >
            &larr; Back
          </Link>
        </div>
      </nav>

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-nvidia/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-4xl grid lg:grid-cols-2 gap-10 items-start">
          {/* Left: Plan details */}
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 bg-nvidia/10 border border-nvidia/20 rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 bg-nvidia rounded-full animate-pulse" />
                <span className="text-nvidia text-xs font-bold">
                  Powered by NVIDIA AI
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                SpeakFlow Pro
                <br />
                <span className="text-primary">Annual Plan</span>
              </h1>
              <p className="text-slate-400">
                7-day free trial, then billed annually. Cancel anytime.
              </p>
            </div>

            {/* Price card */}
            <div className="bg-card border border-primary/30 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Annual plan</p>
                  <div className="flex items-end gap-2 mt-1">
                    <span className="text-4xl font-extrabold text-white">
                      $79.99
                    </span>
                    <span className="text-slate-400 text-base pb-1">/year</span>
                  </div>
                  <p className="text-primary text-sm font-medium mt-1">
                    Just $6.67/month — save 49%
                  </p>
                </div>
                <div className="text-right">
                  <span className="bg-green-500/20 border border-green-500/30 text-green-400 text-sm font-bold px-3 py-1.5 rounded-full">
                    SAVE 49%
                  </span>
                  <p className="text-slate-500 text-xs mt-2 line-through">
                    $155.88/yr
                  </p>
                </div>
              </div>

              <div className="h-px bg-border/50" />

              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <svg
                  className="w-4 h-4 text-green-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Includes 7-day free trial · Secure payment via Stripe
              </div>
            </div>

            {/* Features */}
            <div className="space-y-3">
              <h3 className="text-white font-semibold">
                Everything included:
              </h3>
              <ul className="space-y-2">
                {proFeatures.map((feature) => (
                  <li key={feature.text} className="flex items-center gap-3">
                    <span className="text-lg">{feature.icon}</span>
                    <span className="text-slate-300 text-sm">{feature.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Monthly alternative */}
            <div className="bg-card/50 border border-border rounded-2xl p-4">
              <p className="text-slate-400 text-sm">
                Prefer monthly billing?{' '}
                <a
                  href="https://apps.apple.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-light transition-colors font-medium"
                >
                  Get $12.99/mo on the App Store
                </a>{' '}
                or{' '}
                <a
                  href="https://play.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary-light transition-colors font-medium"
                >
                  Google Play
                </a>
                .
              </p>
            </div>
          </div>

          {/* Right: Checkout */}
          <div className="lg:sticky lg:top-8 space-y-4">
            <div className="bg-card border border-border rounded-3xl p-8 space-y-6 shadow-card">
              <div className="space-y-1">
                <h2 className="text-xl font-bold text-white">
                  Start your free trial
                </h2>
                <p className="text-slate-400 text-sm">
                  No charge for 7 days. Cancel before then and you owe nothing.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="checkout-email"
                  className="text-slate-300 text-sm font-medium"
                >
                  Work email
                </label>
                <input
                  id="checkout-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-2xl border border-border bg-background/50 px-4 py-3 text-white outline-none transition focus:border-primary"
                  autoComplete="email"
                />
                <p className="text-slate-500 text-xs">
                  Use the same email in the app so we can attach your subscription correctly.
                </p>
              </div>

              {/* Order summary */}
              <div className="bg-background/50 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">SpeakFlow Pro (Annual)</span>
                  <span className="text-white font-medium">$79.99</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-400">7-day free trial</span>
                  <span className="text-green-400 font-medium">-$79.99</span>
                </div>
                <div className="h-px bg-border" />
                <div className="flex items-center justify-between text-sm font-bold">
                  <span className="text-white">Due today</span>
                  <span className="text-green-400 text-lg">$0.00</span>
                </div>
                <p className="text-slate-500 text-xs">
                  $79.99 charged on{' '}
                  {new Date(
                    Date.now() + 7 * 24 * 60 * 60 * 1000
                  ).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                  {!webCheckoutEnabled && (
                    <a
                      href={toMailto(CONTACT_EMAIL, 'Founding member access')}
                      className="mt-2 inline-flex text-sm font-medium text-red-300 underline underline-offset-4"
                    >
                      Email {CONTACT_EMAIL}
                    </a>
                  )}
                </div>
              )}

              {/* Checkout button */}
              <button
                onClick={handleCheckout}
                disabled={loading || !webCheckoutEnabled}
                className="w-full py-4 px-6 rounded-2xl bg-primary hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100 shadow-glow-purple flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Redirecting to Stripe...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    {webCheckoutEnabled
                      ? 'Checkout with Stripe — Free for 7 days'
                      : 'Web checkout activating soon'}
                  </>
                )}
              </button>

              {!webCheckoutEnabled && (
                <p className="text-center text-xs text-slate-500">
                  Web annual billing will switch on after payment account approval.
                  Mobile subscriptions remain available through the App Store.
                </p>
              )}

              {/* Trust badges */}
              <div className="space-y-2">
                {[
                  'SSL encrypted · Powered by Stripe',
                  'Cancel anytime from account settings',
                  'Email reminder 3 days before trial ends',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <svg
                      className="w-3.5 h-3.5 text-green-400 flex-shrink-0"
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
                    <span className="text-slate-500 text-xs">{item}</span>
                  </div>
                ))}
              </div>

              {/* Stripe logo */}
              <div className="flex items-center justify-center gap-2 pt-2">
                <span className="text-slate-600 text-xs">Secured by</span>
                <span className="text-slate-400 font-bold text-sm tracking-tight">
                  stripe
                </span>
              </div>
            </div>
            <ManageBillingCard defaultEmail={email} />
          </div>
        </div>
      </div>
    </main>
  )
}
