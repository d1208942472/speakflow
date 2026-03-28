import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How NVIDIA Riva ASR Gives You Real-Time Pronunciation Scores | SpeakFlow',
  description:
    'A deep dive into the AI technology powering SpeakFlow\'s instant pronunciation feedback. Learn how NVIDIA Riva ASR measures phoneme accuracy, fluency, and prosody for business English learners.',
  openGraph: {
    title: 'How NVIDIA Riva ASR Gives You Real-Time Pronunciation Scores',
    description: 'The AI technology powering SpeakFlow\'s instant pronunciation feedback for business English learners.',
    type: 'article',
  },
}

export default function BlogPost() {
  return (
    <main className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b border-border/50 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">S</span>
            </div>
            <span className="text-white font-bold text-xl">SpeakFlow</span>
          </Link>
          <Link href="/blog" className="text-slate-400 hover:text-white text-sm transition-colors">
            &larr; Blog
          </Link>
        </div>
      </nav>

      {/* Article */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        {/* Meta */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-primary text-xs font-semibold bg-primary/10 border border-primary/20 px-2 py-1 rounded-full">
            NVIDIA AI
          </span>
          <span className="text-slate-500 text-sm">5 min read · Mar 15, 2026</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-6">
          How NVIDIA Riva ASR Gives You Pronunciation Scores in Real Time
        </h1>

        <p className="text-xl text-slate-400 leading-relaxed mb-10 border-l-4 border-primary/50 pl-4">
          Most language apps either give you a vague "good job!" or nothing at all. SpeakFlow
          uses NVIDIA Riva — the same ASR technology used in enterprise voice systems — to score
          your pronunciation at the phoneme level, in under 500 milliseconds.
        </p>

        {/* NVIDIA badge */}
        <div className="bg-card border border-[#76b900]/30 rounded-2xl p-5 mb-10 flex items-start gap-4">
          <div className="text-3xl">⬡</div>
          <div>
            <p className="text-[#76b900] font-semibold text-sm mb-1">Powered by NVIDIA Riva</p>
            <p className="text-slate-400 text-sm">
              SpeakFlow integrates NVIDIA Riva&apos;s <code className="text-primary bg-primary/10 px-1 rounded">parakeet-ctc-0.6b-en</code> model
              for English pronunciation scoring — the same speech recognition technology used in
              NVIDIA-powered enterprise products worldwide.
            </p>
          </div>
        </div>

        <div className="prose prose-invert prose-lg max-w-none">
          <h2 className="text-2xl font-bold text-white mt-10 mb-4">What Is Automatic Speech Recognition (ASR)?</h2>
          <p className="text-slate-300 leading-relaxed mb-6">
            Automatic Speech Recognition converts spoken audio into text — but modern ASR systems
            do much more than transcription. NVIDIA Riva&apos;s models produce word-level timing
            information, confidence scores, and alignment data that SpeakFlow uses to build a
            detailed pronunciation report.
          </p>
          <p className="text-slate-300 leading-relaxed mb-6">
            When you practice saying &quot;I&apos;d like to discuss the quarterly results,&quot; Riva doesn&apos;t
            just hear the words — it tracks the timing and acoustic confidence of each phoneme,
            giving SpeakFlow the raw data to identify exactly where your pronunciation deviates
            from native speaker patterns.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">Why Parakeet CTC? The Architecture Choice</h2>
          <p className="text-slate-300 leading-relaxed mb-6">
            NVIDIA&apos;s <code className="text-primary bg-primary/10 px-1 rounded text-sm">parakeet-ctc-0.6b-en</code> uses
            Connectionist Temporal Classification (CTC) — an architecture that aligns audio frames
            to text characters without requiring explicit phoneme boundaries. This makes it both
            fast and accurate, typically returning results in under 500ms on GPU infrastructure.
          </p>
          <p className="text-slate-300 leading-relaxed mb-6">
            For language learners, CTC&apos;s frame-level confidence scores are gold. SpeakFlow
            extracts these to compute a phoneme-level accuracy score for every word, not just
            an overall &quot;you spoke some English&quot; result.
          </p>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">The Three-Layer Scoring System</h2>
          <p className="text-slate-300 leading-relaxed mb-4">
            SpeakFlow combines three independent signals into your session score:
          </p>

          <div className="grid gap-4 mb-8">
            {[
              {
                number: '1',
                title: 'Phoneme Accuracy (NVIDIA Riva)',
                desc: 'Did you produce the right sounds? Riva\'s CTC confidence scores measure how closely each phoneme matches a native-speaker reference. Common errors for Asian speakers — like /l/ vs /r/ or /th/ — are caught here.',
              },
              {
                number: '2',
                title: 'Contextual Fluency (NVIDIA NIM Llama 3.1)',
                desc: 'Was your response appropriate, professional, and coherent? Llama 3.1 70B evaluates the content and provides coaching feedback, including a fluency multiplier (0.5–2.0×) that modifies your base score.',
              },
              {
                number: '3',
                title: 'Quality Alignment (NVIDIA Nemotron Reward 70B)',
                desc: 'Human preference modeling measures how close your speech is to what a real business professional would say. This blends 30% into your final score to reward natural-sounding responses over technically-correct-but-robotic ones.',
              },
            ].map((item) => (
              <div key={item.number} className="bg-card border border-border rounded-xl p-5 flex gap-4">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 text-white font-black text-sm">
                  {item.number}
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">Why This Beats Traditional Language Apps</h2>
          <p className="text-slate-300 leading-relaxed mb-6">
            Apps like ELSA Speak score pronunciation using proprietary models that can&apos;t
            evaluate business context. You could perfectly pronounce &quot;synergy&quot; while using it
            in a sentence that makes no sense in a boardroom — ELSA would give you full marks.
          </p>
          <p className="text-slate-300 leading-relaxed mb-6">
            Cambly connects you to human tutors who give qualitative feedback, but humans can&apos;t
            track millisecond-level phoneme timing, and their assessments aren&apos;t consistent.
          </p>
          <p className="text-slate-300 leading-relaxed mb-8">
            SpeakFlow&apos;s three-layer NVIDIA stack gives you both: precise acoustic scoring from
            Riva plus contextual business-English judgment from Llama 3.1 — in one session,
            in real time.
          </p>

          <div className="bg-card border border-primary/30 rounded-2xl p-6 mb-10">
            <h3 className="text-white font-bold text-lg mb-3">The Numbers</h3>
            <ul className="space-y-2">
              {[
                'Target latency: /speech/transcribe P99 < 500ms',
                '25 business scenarios: meetings, negotiations, presentations, emails',
                '12 languages for coaching translation (NVIDIA Riva Translate)',
                '11 NVIDIA services in the full SpeakFlow stack',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-slate-300 text-sm">
                  <span className="text-primary mt-1 flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <h2 className="text-2xl font-bold text-white mt-10 mb-4">What&apos;s Next: Multilingual Scoring</h2>
          <p className="text-slate-300 leading-relaxed mb-6">
            SpeakFlow also integrates NVIDIA&apos;s multilingual ASR model
            (<code className="text-primary bg-primary/10 px-1 rounded text-sm">parakeet-1.1b</code>)
            for 25-language transcription. This powers our coaching translation feature — when
            you need feedback in your native language, Riva Translate delivers it in one of
            12 supported languages, so nothing is lost in the coaching experience.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-br from-primary/20 to-violet-900/30 border border-primary/30 rounded-3xl p-8 text-center">
          <h3 className="text-2xl font-bold text-white mb-3">Try it for free</h3>
          <p className="text-slate-400 mb-6">
            Experience NVIDIA Riva pronunciation scoring with your first 3 lessons — no credit card required.
          </p>
          <Link
            href="/subscribe"
            className="inline-block bg-primary hover:bg-primary-dark text-white font-bold px-8 py-4 rounded-2xl transition-colors"
          >
            Start Free Today
          </Link>
        </div>
      </article>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 text-center mt-8">
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
