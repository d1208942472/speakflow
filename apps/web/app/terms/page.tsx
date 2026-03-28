import { Metadata } from 'next'
import Link from 'next/link'
import { LEGAL_EMAIL, SUPPORT_EMAIL, toMailto } from '../../lib/contact'
import { getSiteUrl } from '../../lib/site'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'SpeakFlow Terms of Service — your rights and responsibilities when using SpeakFlow.',
}

const LAST_UPDATED = 'March 22, 2026'
const SITE_HOST = new URL(getSiteUrl()).host

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background text-slate-300">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-primary hover:text-primary-light text-sm mb-6 inline-block">
            ← Back to SpeakFlow
          </Link>
          <h1 className="text-3xl font-extrabold text-white mb-2">Terms of Service</h1>
          <p className="text-slate-500 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="space-y-8 text-slate-300 leading-relaxed">

          <Section title="1. Acceptance of Terms">
            <p>
              By downloading, installing, or using SpeakFlow (&quot;the App&quot;) or visiting {SITE_HOST}
              (&quot;the Website&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do
              not agree to these Terms, do not use our Service.
            </p>
            <p>
              These Terms apply to all users of the Service, including free users and paid subscribers.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              SpeakFlow is an AI-powered business English speaking coach that uses NVIDIA speech
              recognition technology to provide real-time pronunciation feedback. The Service includes:
            </p>
            <ul>
              <li>Business English speaking lessons and scenarios</li>
              <li>AI pronunciation scoring powered by NVIDIA Riva</li>
              <li>Conversational AI coaching powered by Meta Llama 3.1 (via NVIDIA NIM)</li>
              <li>Gamification features (streaks, leagues, Fluency Points)</li>
              <li>Free and paid subscription tiers</li>
            </ul>
          </Section>

          <Section title="3. Account Registration">
            <p>
              To use SpeakFlow, you must create an account. You agree to:
            </p>
            <ul>
              <li>Provide accurate, current, and complete registration information</li>
              <li>Keep your password secure and not share it with others</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Be responsible for all activity occurring under your account</li>
            </ul>
            <p>
              You must be at least 13 years old to create an account. By registering, you represent
              that you meet this age requirement.
            </p>
          </Section>

          <Section title="4. Subscriptions and Billing">
            <Subsection title="4.1 Free Tier">
              <p>
                SpeakFlow offers a free tier with limited access to lessons and sessions. No credit
                card is required for the free tier.
              </p>
            </Subsection>
            <Subsection title="4.2 Pro Subscription — Web (Annual)">
              <p>
                The Pro annual plan is available at $79.99/year via our website, billed through Stripe.
                A 7-day free trial is offered. You will be charged after the trial period unless you
                cancel before it ends.
              </p>
            </Subsection>
            <Subsection title="4.3 Pro Subscription — Mobile (Monthly/Annual)">
              <p>
                Mobile subscriptions are available via the Apple App Store ($12.99/month) and Google
                Play Store. These subscriptions are subject to the App Store&apos;s or Google Play&apos;s
                respective terms and managed through RevenueCat.
              </p>
            </Subsection>
            <Subsection title="4.4 Auto-Renewal">
              <p>
                Subscriptions automatically renew unless cancelled at least 24 hours before the end of
                the current billing period. You can manage and cancel your subscription:
              </p>
              <ul>
                <li>Web: through your account settings at {SITE_HOST}</li>
                <li>iOS: through Apple ID → Subscriptions in Settings</li>
                <li>Android: through Google Play → Subscriptions</li>
              </ul>
            </Subsection>
            <Subsection title="4.5 Refund Policy">
              <p>
                Web annual subscriptions: You may request a full refund within 14 days of your first
                payment by contacting <a href={toMailto(SUPPORT_EMAIL)} className="text-primary hover:underline">{SUPPORT_EMAIL}</a>.
                After 14 days, refunds are provided at our discretion.
              </p>
              <p>
                Mobile subscriptions: Refund requests are handled by Apple or Google according to
                their respective refund policies.
              </p>
            </Subsection>
          </Section>

          <Section title="5. Acceptable Use">
            <p>You agree NOT to:</p>
            <ul>
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Attempt to reverse-engineer, decompile, or hack the Service</li>
              <li>Use automated bots or scripts to manipulate gamification data</li>
              <li>Share, sell, or transfer your account to another person</li>
              <li>Upload or transmit malicious code or content</li>
              <li>Harass, abuse, or harm other users or our team</li>
              <li>Use the Service to generate or distribute spam</li>
              <li>Circumvent any access controls or usage limits</li>
            </ul>
            <p>
              Violation of these terms may result in immediate termination of your account without
              refund.
            </p>
          </Section>

          <Section title="6. Microphone and Audio">
            <p>
              SpeakFlow requires microphone access to function. By granting microphone access, you
              consent to the recording and processing of your voice for the purpose of pronunciation
              analysis. You retain ownership of your voice recordings. We process audio transiently
              and do not permanently store raw audio files.
            </p>
          </Section>

          <Section title="7. Intellectual Property">
            <p>
              All content in SpeakFlow — including lesson content, software code, designs, trademarks,
              and AI model outputs — is owned by SpeakFlow or licensed to us. You may not copy,
              reproduce, distribute, or create derivative works from our content without explicit
              written permission.
            </p>
            <p>
              You retain rights to your own content (voice recordings, written inputs). You grant us
              a non-exclusive license to use your content to provide and improve the Service.
            </p>
          </Section>

          <Section title="8. Third-Party Services">
            <p>
              SpeakFlow integrates with third-party services including NVIDIA (AI processing),
              Supabase (database), Stripe (payments), RevenueCat (subscriptions), Apple App Store,
              and Google Play. Your use of these services is also subject to their respective terms
              and privacy policies. We are not responsible for the practices of third-party services.
            </p>
          </Section>

          <Section title="9. Disclaimer of Warranties">
            <p>
              THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
              EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED,
              ERROR-FREE, OR FREE OF VIRUSES OR OTHER HARMFUL COMPONENTS.
            </p>
            <p>
              WE MAKE NO GUARANTEES REGARDING LEARNING OUTCOMES, LANGUAGE IMPROVEMENT, OR
              PROFESSIONAL SUCCESS RESULTING FROM USE OF THE SERVICE.
            </p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, SPEAKFLOW SHALL NOT BE LIABLE FOR ANY
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF
              PROFITS, DATA, OR GOODWILL, ARISING FROM YOUR USE OF THE SERVICE.
            </p>
            <p>
              OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS SHALL NOT EXCEED THE AMOUNT YOU PAID TO US
              IN THE 12 MONTHS PRECEDING THE CLAIM.
            </p>
          </Section>

          <Section title="11. Termination">
            <p>
              We may suspend or terminate your account at any time for violation of these Terms or
              if we determine your use is harmful to the Service or other users. You may terminate
              your account at any time by contacting us.
            </p>
            <p>
              Upon termination, your right to use the Service immediately ceases. Sections regarding
              intellectual property, disclaimers, limitation of liability, and dispute resolution
              survive termination.
            </p>
          </Section>

          <Section title="12. Changes to Terms">
            <p>
              We reserve the right to modify these Terms at any time. We will provide notice of
              material changes by email or through the Service. Your continued use after changes
              are posted constitutes acceptance. If you disagree with the updated Terms, you must
              stop using the Service.
            </p>
          </Section>

          <Section title="13. Governing Law">
            <p>
              These Terms are governed by and construed in accordance with the laws of the State of
              Delaware, United States, without regard to conflict of law principles. Any disputes
              shall be resolved through binding arbitration, except that either party may seek
              injunctive relief in a court of competent jurisdiction.
            </p>
          </Section>

          <Section title="14. Contact">
            <p>
              For questions about these Terms, contact us at:
            </p>
            <ul>
              <li>Email: <a href={toMailto(LEGAL_EMAIL)} className="text-primary hover:underline">{LEGAL_EMAIL}</a></li>
              <li>
                Privacy inquiries:{' '}
                <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              </li>
            </ul>
          </Section>

        </div>
      </div>
    </main>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="text-xl font-bold text-white mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-base font-semibold text-slate-200 mb-2">{title}</h3>
      <div className="space-y-2 text-slate-400">{children}</div>
    </div>
  )
}
