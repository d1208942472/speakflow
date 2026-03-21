import Stripe from 'stripe'
import { NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10',
})

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000')

export async function POST(request: Request) {
  try {
    // Validate environment variables
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY is not set')
      return NextResponse.json(
        { error: 'Payment service is not configured' },
        { status: 500 }
      )
    }

    if (!process.env.STRIPE_ANNUAL_PRICE_ID) {
      console.error('STRIPE_ANNUAL_PRICE_ID is not set')
      return NextResponse.json(
        { error: 'Product pricing is not configured' },
        { status: 500 }
      )
    }

    // Parse optional email from request body
    let email: string | undefined
    try {
      const body = await request.json()
      email = body?.email
    } catch {
      // No body or invalid JSON — that's fine
    }

    // Create Stripe checkout session for annual plan ($79.99/yr) with 7-day trial
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_ANNUAL_PRICE_ID,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          plan: 'annual',
          source: 'web',
        },
      },
      success_url: `${SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/subscribe`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_email: email,
      metadata: {
        plan: 'annual',
        source: 'web_landing',
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    // Handle Stripe-specific errors
    if (error instanceof Stripe.errors.StripeError) {
      console.error('Stripe error:', error.message)
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode ?? 500 }
      )
    }

    // Handle unexpected errors
    console.error('Unexpected error creating checkout session:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    )
  }
}
