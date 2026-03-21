'use client'

import Link from 'next/link'
import { NvidiaBadge } from './NvidiaBadge'

function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[280px] animate-float">
      {/* Phone frame */}
      <div className="relative bg-card border border-border rounded-[40px] p-3 shadow-[0_0_60px_rgba(108,99,255,0.25)] overflow-hidden">
        {/* Screen */}
        <div className="bg-[#0c0c1a] rounded-[32px] overflow-hidden">
          {/* Status bar */}
          <div className="flex justify-between items-center px-5 pt-4 pb-2">
            <span className="text-slate-400 text-xs font-medium">9:41</span>
            <div className="w-20 h-5 bg-[#1a1a2e] rounded-full" />
            <div className="flex gap-1 items-center">
              <span className="text-slate-400 text-xs">●●●</span>
            </div>
          </div>

          {/* App content */}
          <div className="px-4 pb-6 pt-2 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs">Good morning,</p>
                <p className="text-white font-bold text-base">Alex 👋</p>
              </div>
              <div className="flex items-center gap-1 bg-orange-500/20 border border-orange-500/30 rounded-full px-3 py-1">
                <span className="text-orange-400 text-sm">🔥</span>
                <span className="text-orange-400 font-bold text-sm">21</span>
              </div>
            </div>

            {/* Score ring */}
            <div className="flex justify-center py-2">
              <div className="relative w-28 h-28">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#2a2a4a"
                    strokeWidth="8"
                  />
                  {/* Score ring */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#6C63FF"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="251.2"
                    strokeDashoffset="60"
                    className="transition-all duration-1000"
                  />
                  {/* NVIDIA accent */}
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="none"
                    stroke="#76B900"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="251.2"
                    strokeDashoffset="220"
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-white font-bold text-2xl">92</span>
                  <span className="text-slate-400 text-xs">Score</span>
                </div>
              </div>
            </div>

            {/* Lesson card */}
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💼</span>
                <span className="text-white text-xs font-semibold">Job Interview</span>
                <span className="ml-auto bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">Today</span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                "Tell me about your greatest professional achievement..."
              </p>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 bg-[#2a2a4a] rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full w-3/4" />
                </div>
                <span className="text-slate-400 text-xs">3 min</span>
              </div>
            </div>

            {/* Waveform */}
            <div className="bg-[#1a1a2e] border border-border rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[#76B900] text-sm">🎤</span>
                <span className="text-slate-300 text-xs font-medium">Recording...</span>
                <span className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              </div>
              <div className="flex items-end gap-0.5 h-8 justify-center">
                {[4, 8, 6, 12, 9, 15, 11, 7, 13, 10, 6, 14, 8, 5, 11, 9, 7].map(
                  (h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-primary/60 rounded-full"
                      style={{ height: `${h * 2}px` }}
                    />
                  )
                )}
              </div>
            </div>

            {/* Feedback pills */}
            <div className="flex flex-wrap gap-1.5">
              <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
                ✓ Clarity
              </span>
              <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full">
                ✓ Pace
              </span>
              <span className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs px-2 py-1 rounded-full">
                ~ Tone
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Glow effect */}
      <div className="absolute -inset-4 bg-primary/10 rounded-[50px] blur-2xl -z-10" />
    </div>
  )
}

export function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-hero-glow" />
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-nvidia/10 rounded-full blur-3xl" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(108,99,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(108,99,255,1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <div className="flex flex-col gap-6 text-center lg:text-left">
            {/* NVIDIA Badge */}
            <div className="flex justify-center lg:justify-start">
              <NvidiaBadge />
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
              Speak Business English{' '}
              <span className="text-primary">Like a Native</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-lg mx-auto lg:mx-0">
              3 minutes a day. Real-time AI pronunciation scoring. Duolingo-style
              streaks. Used by{' '}
              <span className="text-white font-semibold">
                10,000+ non-native professionals
              </span>
              .
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <a
                href="https://apps.apple.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-white text-gray-900 font-bold px-6 py-4 rounded-2xl hover:bg-slate-100 transition-all duration-200 hover:scale-105 shadow-lg text-base"
              >
                <svg
                  className="w-6 h-6"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
                Download for iOS
              </a>
              <Link
                href="/subscribe"
                className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold px-6 py-4 rounded-2xl transition-all duration-200 hover:scale-105 shadow-glow-purple text-base"
              >
                Get Pro — $79.99/yr
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>

            {/* Social proof stars */}
            <div className="flex items-center gap-3 justify-center lg:justify-start">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className="w-5 h-5 text-yellow-400"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-slate-300 text-sm font-medium">
                4.8/5 · 2,000+ Reviews
              </span>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                <svg
                  className="w-4 h-4 text-green-400"
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
                7-day free trial
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                <svg
                  className="w-4 h-4 text-green-400"
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
                Cancel anytime
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 text-sm">
                <svg
                  className="w-4 h-4 text-green-400"
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
                No credit card for free tier
              </div>
            </div>
          </div>

          {/* Right: Phone mockup */}
          <div className="flex justify-center lg:justify-end">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  )
}
