'use client'

import { useState } from 'react'

const faqs = [
  {
    question: "What makes SpeakFlow different from Duolingo?",
    answer:
      "Duolingo is excellent for vocabulary and grammar, but it doesn't practice the skill that actually matters in business: speaking under pressure and being understood. SpeakFlow focuses 100% on spoken output — you practice real business scenarios, get instant AI pronunciation scores, and build the confidence to speak in high-stakes meetings. We've borrowed Duolingo's habit-building mechanics (streaks, leagues, XP) but applied them to professional speaking, not toy sentences.",
  },
  {
    question: "How does the NVIDIA AI pronunciation scoring work?",
    answer:
      "SpeakFlow uses NVIDIA Riva — a state-of-the-art speech AI platform used by enterprises worldwide. When you speak, Riva performs acoustic analysis on every phoneme you produce, comparing your pronunciation to native speaker models. You receive a real-time score (0–100) plus specific feedback on which sounds need work and what the correct tongue/lip position should be. This happens in under 200ms so feedback feels instant, not delayed.",
  },
  {
    question: "Which English accents does SpeakFlow support?",
    answer:
      "SpeakFlow currently supports American English (General American) as the primary standard, with British English (RP) as a secondary option — both commonly required in international business. The AI coach understands a wide range of input accents including Indian English, Chinese English, Spanish English, and German English, so you won't be penalized for your accent — only measured on clarity and intelligibility.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes, absolutely. The annual web plan ($79.99/yr) can be cancelled anytime from your account settings or by emailing support@speakflow.ai. You keep access until the end of your paid period. Monthly App Store subscriptions can be cancelled directly from your iOS/Android subscription settings. We don't believe in dark patterns — cancellation takes 30 seconds.",
  },
  {
    question: "Is SpeakFlow good for job interviews specifically?",
    answer:
      'Job interview prep is one of our most popular scenario categories. We have specific scenarios for behavioral questions ("Tell me about a time when..."), technical interviews, salary negotiation, offer acceptance/rejection, and follow-up emails. Many users report that practicing these scenarios 5–7 days before an interview significantly reduces anxiety and makes their answers feel more natural and structured.',
  },
  {
    question: "What's included in the free tier?",
    answer:
      "The free tier includes 3 complete lesson scenarios, basic pronunciation feedback, and 5 practice sessions per day — enough to genuinely experience SpeakFlow and see improvement. There's no trial expiration date; the free tier is permanently free. You can stay on it as long as you want. If you hit the session limit or want the full 25+ scenario library and AI coach Max, that's when Pro becomes worth it.",
  },
]

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border border-border rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-6 text-left hover:bg-card/50 transition-colors duration-200"
        aria-expanded={isOpen}
      >
        <span className="text-white font-semibold text-base leading-snug">
          {question}
        </span>
        <span
          className={`flex-shrink-0 w-6 h-6 rounded-full border border-border flex items-center justify-center transition-all duration-200 ${
            isOpen
              ? 'bg-primary border-primary rotate-45'
              : 'bg-transparent rotate-0'
          }`}
        >
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M12 5v14M5 12h14"
            />
          </svg>
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 pb-6">
          <div className="h-px bg-border mb-4" />
          <p className="text-slate-400 text-sm leading-relaxed">{answer}</p>
        </div>
      </div>
    </div>
  )
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/20 to-transparent" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12 space-y-4">
          <span className="text-primary text-sm font-semibold uppercase tracking-widest">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Common questions
          </h2>
          <p className="text-slate-400">
            Can&apos;t find your answer?{' '}
            <a
              href="mailto:support@speakflow.ai"
              className="text-primary hover:text-primary-light transition-colors"
            >
              Email us
            </a>
            .
          </p>
        </div>

        {/* FAQ list */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
