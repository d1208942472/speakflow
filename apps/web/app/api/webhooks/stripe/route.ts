import Stripe from 'stripe'
import { NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase admin client — uses service role key (server-only)
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing Supabase environment variables')
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  })
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

// Stripe events that grant Pro access
const PRO_GRANTING_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.updated',
])

// Stripe events that revoke Pro access
const PRO_REVOKING_EVENTS = new Set([
  'customer.subscription.deleted',
])

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.error('[Stripe Webhook] STRIPE_WEBHOOK_SECRET is not set')
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    )
  }

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Signature verification failed'
    console.error('[Stripe Webhook] Verification failed:', message)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`)

  try {
    const supabase = getSupabaseAdmin()

    if (PRO_GRANTING_EVENTS.has(event.type)) {
      const customerEmail = extractCustomerEmail(event)
      if (customerEmail) {
        await setProStatus(supabase, customerEmail, true)
        console.log(`[Stripe Webhook] Pro GRANTED for ${customerEmail}`)
      }
    } else if (PRO_REVOKING_EVENTS.has(event.type)) {
      const customerEmail = extractCustomerEmail(event)
      if (customerEmail) {
        await setProStatus(supabase, customerEmail, false)
        console.log(`[Stripe Webhook] Pro REVOKED for ${customerEmail}`)
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Database update failed'
    console.error('[Stripe Webhook] Error processing event:', message)
    // Return 200 to prevent Stripe retries for non-transient errors
    return NextResponse.json({ error: message }, { status: 200 })
  }

  return NextResponse.json({ received: true })
}

/**
 * Extract customer email from Stripe event.
 * Handles checkout.session.completed and subscription events.
 */
function extractCustomerEmail(event: Stripe.Event): string | null {
  // checkout.session.completed has customer_email or customer_details.email
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    return (
      session.customer_email ??
      (session.customer_details as { email?: string } | null)?.email ??
      null
    )
  }

  // subscription events: use metadata.email if available (set at checkout time)
  const obj = event.data.object as { metadata?: Record<string, string> }
  return obj.metadata?.email ?? null
}

/**
 * Update is_pro flag on user profile matched by email via Supabase auth.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function setProStatus(
  supabase: SupabaseClient<any>,
  email: string,
  isPro: boolean
): Promise<void> {
  // Look up auth user by email using admin API
  const { data: users, error: listError } =
    await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })

  if (listError) {
    throw new Error(`Failed to list users: ${listError.message}`)
  }

  const user = users.users.find((u) => u.email === email)
  if (!user) {
    console.warn(`[Stripe Webhook] No user found for email: ${email}`)
    return
  }

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ is_pro: isPro })
    .eq('id', user.id)

  if (updateError) {
    throw new Error(`Failed to update profile: ${updateError.message}`)
  }
}
