'use client'

import { useState } from 'react'
import { getApiUrl } from '../lib/api'

interface ManageBillingCardProps {
  defaultEmail?: string
  title?: string
  description?: string
}

export function ManageBillingCard({
  defaultEmail = '',
  title = 'Already subscribed?',
  description = 'Open the Stripe billing portal to update your card, cancel, or review invoices.',
}: ManageBillingCardProps) {
  const [email, setEmail] = useState(defaultEmail)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleManageBilling() {
    setLoading(true)
    setError(null)

    try {
      if (!email.trim()) {
        throw new Error('Enter the same email used for checkout')
      }

      const response = await fetch(getApiUrl('/billing/portal-session'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'Failed to open billing portal')
      }

      if (!data.url) {
        throw new Error('No billing portal URL returned')
      }

      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open billing portal')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-card/70 p-5 space-y-4">
      <div className="space-y-1">
        <h3 className="text-white font-semibold">{title}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </div>

      <div className="space-y-2">
        <label htmlFor="billing-email" className="text-slate-300 text-sm font-medium">
          Billing email
        </label>
        <input
          id="billing-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@company.com"
          className="w-full rounded-2xl border border-border bg-background/50 px-4 py-3 text-white outline-none transition focus:border-primary"
          autoComplete="email"
        />
      </div>

      {error && (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        onClick={handleManageBilling}
        disabled={loading}
        className="w-full rounded-2xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm font-semibold text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? 'Opening billing portal...' : 'Manage subscription'}
      </button>
    </div>
  )
}
