const features = [
  {
    emoji: '🎤',
    title: 'Real-time Pronunciation Scoring',
    description:
      'NVIDIA Riva AI analyzes every phoneme you produce, giving you a precise score on clarity, stress, and intonation — instantly, not after a delay.',
    badge: 'NVIDIA Riva',
    badgeColor: 'text-nvidia bg-nvidia/10 border-nvidia/20',
    highlight: true,
  },
  {
    emoji: '🤖',
    title: 'AI Conversation Practice',
    description:
      "Meet Max, your always-available AI coach. He adapts to your level, challenges you with follow-up questions, and never judges your mistakes.",
    badge: 'Llama 3.1',
    badgeColor: 'text-primary bg-primary/10 border-primary/20',
    highlight: false,
  },
  {
    emoji: '🔥',
    title: 'Daily Streak System',
    description:
      "Science-backed habit loops keep you coming back. Streak shields protect your progress on busy days. Duolingo-proven mechanics, business-level content.",
    badge: 'Proven Method',
    badgeColor: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    highlight: false,
  },
  {
    emoji: '💼',
    title: 'Business Scenarios',
    description:
      '25+ high-stakes scenarios: job interviews at FAANG companies, board-level presentations, salary negotiations, cold sales calls, and international conferences.',
    badge: '25+ Scenarios',
    badgeColor: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
    highlight: false,
  },
  {
    emoji: '🏆',
    title: 'Weekly Leagues',
    description:
      'Compete with professionals at your level, earn XP, get promoted to higher leagues. The competitive pressure that actually makes you practice harder.',
    badge: 'Leaderboards',
    badgeColor: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
    highlight: false,
  },
  {
    emoji: '📱',
    title: 'iOS & Android Native',
    description:
      'Built for your commute, lunch break, or morning routine. Core lessons work offline. Voice analysis happens on-device for privacy and speed.',
    badge: 'Offline Ready',
    badgeColor: 'text-teal-400 bg-teal-400/10 border-teal-400/20',
    highlight: false,
  },
]

export function FeaturesSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/20 to-transparent" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-nvidia/5 rounded-full blur-3xl" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16 space-y-4">
          <span className="text-primary text-sm font-semibold uppercase tracking-widest">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
            Everything you need to sound{' '}
            <span className="text-primary">like a pro</span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Not another vocabulary app. SpeakFlow trains the skill that actually
            matters in meetings: speaking confidently and being understood.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`group relative flex flex-col gap-4 p-7 rounded-3xl border transition-all duration-300 hover-glow ${
                feature.highlight
                  ? 'bg-gradient-to-br from-nvidia/10 to-primary/5 border-nvidia/30'
                  : 'bg-card border-border hover:border-primary/30'
              }`}
            >
              {/* Emoji */}
              <div className="text-4xl">{feature.emoji}</div>

              {/* Badge */}
              <span
                className={`self-start text-xs font-bold px-2.5 py-1 rounded-full border ${feature.badgeColor}`}
              >
                {feature.badge}
              </span>

              {/* Content */}
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors duration-200">
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Highlight glow */}
              {feature.highlight && (
                <div className="absolute inset-0 rounded-3xl bg-nvidia/3 pointer-events-none" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
