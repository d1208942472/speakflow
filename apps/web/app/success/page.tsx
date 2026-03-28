import Link from 'next/link'
import { Metadata } from 'next'
import { ManageBillingCard } from '../../components/ManageBillingCard'

export const metadata: Metadata = {
  title: 'Welcome to SpeakFlow Pro!',
  description: 'Your subscription is active. Start your 7-day free trial.',
}

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-nvidia/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-lg w-full text-center space-y-8">
        {/* Success icon */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-green-500/15 border-2 border-green-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.2)]">
            <svg
              className="w-12 h-12 text-green-400"
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
          </div>
        </div>

        {/* Message */}
        <div className="space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
            Welcome to SpeakFlow Pro!
          </h1>
          <p className="text-slate-400 text-lg">
            Your 7-day free trial has started. You won&apos;t be charged until
            it ends.
          </p>
        </div>

        {/* Next steps */}
        <div className="bg-card border border-border rounded-3xl p-6 space-y-4 text-left">
          <h3 className="text-white font-semibold">Next steps:</h3>
          <ol className="space-y-3">
            {[
              {
                step: '1',
                text: 'Download the SpeakFlow app on iOS or Android',
              },
              {
                step: '2',
                text: 'Sign in with the email you used for checkout',
              },
              {
                step: '3',
                text: 'Start your first business English scenario today',
              },
            ].map((item) => (
              <li key={item.step} className="flex items-start gap-3">
                <span className="w-6 h-6 bg-primary/20 border border-primary/30 rounded-full flex items-center justify-center text-primary text-xs font-bold flex-shrink-0 mt-0.5">
                  {item.step}
                </span>
                <span className="text-slate-300 text-sm">{item.text}</span>
              </li>
            ))}
          </ol>
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-slate-300">
              If you completed checkout on the web before logging into the app, sign in with the
              same email address you used during payment. That is how SpeakFlow links your
              subscription during Public Beta.
            </p>
          </div>
        </div>

        <ManageBillingCard
          title="Need to update billing now?"
          description="Use the same checkout email to open your billing portal and review your subscription."
        />

        {/* App store buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="https://apps.apple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 bg-white text-gray-900 font-bold px-6 py-3.5 rounded-2xl hover:bg-slate-100 transition-all duration-200"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
            </svg>
            Download for iOS
          </a>
          <a
            href="https://play.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 bg-card border border-border text-white font-bold px-6 py-3.5 rounded-2xl hover:bg-card-hover transition-all duration-200"
          >
            Get it on Google Play
          </a>
        </div>

        <Link
          href="/"
          className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
        >
          &larr; Back to homepage
        </Link>
      </div>
    </main>
  )
}
