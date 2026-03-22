import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'SpeakFlow Privacy Policy — how we collect, use, and protect your data.',
}

const LAST_UPDATED = 'March 22, 2026'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background text-slate-300">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-primary hover:text-primary-light text-sm mb-6 inline-block">
            ← Back to SpeakFlow
          </Link>
          <h1 className="text-3xl font-extrabold text-white mb-2">Privacy Policy</h1>
          <p className="text-slate-500 text-sm">Last updated: {LAST_UPDATED}</p>
        </div>

        <div className="prose prose-invert prose-slate max-w-none space-y-8">

          <Section title="1. Introduction">
            <p>
              SpeakFlow (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy
              Policy explains how we collect, use, disclose, and safeguard your information when you use
              the SpeakFlow mobile application and website (collectively, the &quot;Service&quot;).
            </p>
            <p>
              By using our Service, you agree to the collection and use of information in accordance with
              this policy. If you do not agree with any part of this policy, please do not use our Service.
            </p>
          </Section>

          <Section title="2. Information We Collect">
            <Subsection title="2.1 Account Information">
              <p>When you create an account, we collect:</p>
              <ul>
                <li>Email address</li>
                <li>Username (chosen by you)</li>
                <li>Password (stored securely as a bcrypt hash via Supabase Auth)</li>
              </ul>
            </Subsection>
            <Subsection title="2.2 Audio Data">
              <p>
                SpeakFlow requires access to your device&apos;s microphone to provide pronunciation coaching.
                When you complete a speaking session:
              </p>
              <ul>
                <li>
                  Your voice recording is transmitted securely to our backend servers for real-time
                  processing by <strong className="text-white">NVIDIA Riva</strong> (speech recognition and
                  pronunciation scoring).
                </li>
                <li>
                  Audio recordings are processed transiently and are <strong className="text-white">not
                  permanently stored</strong> on our servers. Only the resulting text transcript and
                  pronunciation scores are retained.
                </li>
                <li>
                  Audio is transmitted only when you initiate a speaking session by pressing the microphone
                  button.
                </li>
              </ul>
            </Subsection>
            <Subsection title="2.3 Usage and Performance Data">
              <p>We collect data about how you use the Service:</p>
              <ul>
                <li>Lessons completed, scores, and session history</li>
                <li>Streak and Fluency Points (FP) gamification data</li>
                <li>League standings and rankings</li>
                <li>App navigation patterns (via analytics)</li>
              </ul>
            </Subsection>
            <Subsection title="2.4 Device and Technical Information">
              <ul>
                <li>Device type, operating system, and app version</li>
                <li>IP address and general location (country/region)</li>
                <li>Crash reports and performance data</li>
                <li>Push notification token (if you grant permission)</li>
              </ul>
            </Subsection>
            <Subsection title="2.5 Payment Information">
              <p>
                We do not store your payment card information. All payments are processed by{' '}
                <strong className="text-white">Stripe</strong> (web) and{' '}
                <strong className="text-white">RevenueCat</strong> / Apple App Store / Google Play
                (mobile), which are PCI-DSS compliant. We only receive confirmation of payment success or
                failure and your subscription status.
              </p>
            </Subsection>
          </Section>

          <Section title="3. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul>
              <li>Provide, operate, and improve the SpeakFlow Service</li>
              <li>Process your voice recordings to deliver pronunciation feedback</li>
              <li>Personalize your learning experience and track progress</li>
              <li>Manage your subscription and process payments</li>
              <li>Send you practice reminders and streak notifications (if you opt in)</li>
              <li>Communicate service updates, new features, and support responses</li>
              <li>Ensure security and prevent fraud or abuse</li>
              <li>Comply with legal obligations</li>
            </ul>
          </Section>

          <Section title="4. NVIDIA AI Processing">
            <p>
              SpeakFlow uses <strong className="text-white">NVIDIA Riva</strong> for automatic speech
              recognition (ASR) and pronunciation scoring, and{' '}
              <strong className="text-white">NVIDIA NIM</strong> (Meta Llama 3.1 70B) for AI conversation
              coaching. Your voice data and transcripts are processed through NVIDIA&apos;s cloud APIs in
              accordance with NVIDIA&apos;s privacy practices.
            </p>
            <p>
              NVIDIA processes your data as a service provider on our behalf. Audio is transmitted over
              encrypted connections (TLS) and is not used to train NVIDIA&apos;s models.
            </p>
          </Section>

          <Section title="5. Data Sharing and Disclosure">
            <p>
              We do not sell, trade, or rent your personal information to third parties. We may share
              your information in the following limited circumstances:
            </p>
            <ul>
              <li>
                <strong className="text-white">Service Providers:</strong> We share data with trusted
                third-party vendors who help operate our Service (Supabase for database/auth, NVIDIA for
                AI processing, Stripe/RevenueCat for payments, Vercel/Railway for hosting).
              </li>
              <li>
                <strong className="text-white">Legal Requirements:</strong> We may disclose your
                information if required by law, subpoena, or other legal process.
              </li>
              <li>
                <strong className="text-white">Business Transfers:</strong> In the event of a merger or
                acquisition, your data may be transferred as a business asset.
              </li>
              <li>
                <strong className="text-white">Aggregated Data:</strong> We may share anonymized,
                aggregated statistics that cannot identify individuals.
              </li>
            </ul>
          </Section>

          <Section title="6. Data Retention">
            <p>
              We retain your account data for as long as your account is active or as needed to provide
              the Service. Session transcripts and scores are retained for up to 12 months to support
              your progress tracking.
            </p>
            <p>
              You may request deletion of your account and associated data at any time by contacting us
              at <a href="mailto:privacy@speakflow.ai" className="text-primary hover:underline">privacy@speakflow.ai</a>.
              We will process deletion requests within 30 days.
            </p>
          </Section>

          <Section title="7. Data Security">
            <p>
              We implement industry-standard security measures to protect your information:
            </p>
            <ul>
              <li>All data in transit is encrypted using TLS 1.2 or higher</li>
              <li>Database data is encrypted at rest via Supabase (AES-256)</li>
              <li>Authentication is managed via Supabase Auth with JWT tokens</li>
              <li>We never store raw audio recordings</li>
            </ul>
            <p>
              No method of transmission over the internet is 100% secure. We cannot guarantee absolute
              security but we take reasonable steps to protect your data.
            </p>
          </Section>

          <Section title="8. Children's Privacy">
            <p>
              SpeakFlow is intended for users aged 13 and older. We do not knowingly collect personal
              information from children under 13. If you are a parent or guardian and believe your child
              has provided us with personal information, please contact us and we will take steps to
              delete such information.
            </p>
          </Section>

          <Section title="9. Your Rights">
            <p>Depending on your location, you may have the following rights:</p>
            <ul>
              <li><strong className="text-white">Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong className="text-white">Correction:</strong> Request correction of inaccurate data</li>
              <li><strong className="text-white">Deletion:</strong> Request deletion of your personal data</li>
              <li><strong className="text-white">Portability:</strong> Request your data in a machine-readable format</li>
              <li><strong className="text-white">Opt-out:</strong> Unsubscribe from marketing communications at any time</li>
            </ul>
            <p>
              To exercise these rights, contact us at{' '}
              <a href="mailto:privacy@speakflow.ai" className="text-primary hover:underline">privacy@speakflow.ai</a>.
            </p>
          </Section>

          <Section title="10. Push Notifications">
            <p>
              With your permission, we send push notifications to remind you to practice and maintain
              your streak. You can disable push notifications at any time in your device settings or
              within the SpeakFlow app.
            </p>
          </Section>

          <Section title="11. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material
              changes by posting the new policy on this page and updating the &quot;Last updated&quot; date. Your
              continued use of the Service after changes are posted constitutes your acceptance of the
              revised policy.
            </p>
          </Section>

          <Section title="12. Contact Us">
            <p>
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <ul>
              <li>Email: <a href="mailto:privacy@speakflow.ai" className="text-primary hover:underline">privacy@speakflow.ai</a></li>
              <li>Website: <Link href="/" className="text-primary hover:underline">speakflow.ai</Link></li>
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
      <div className="space-y-3 text-slate-300 leading-relaxed">{children}</div>
    </section>
  )
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="ml-0">
      <h3 className="text-base font-semibold text-slate-200 mb-2">{title}</h3>
      <div className="space-y-2 text-slate-400">{children}</div>
    </div>
  )
}
