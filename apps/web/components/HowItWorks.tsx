const steps = [
  {
    step: '01',
    emoji: '🎯',
    title: 'Start a 3-min challenge',
    description:
      'Pick a business scenario that matters to you — job interviews, board presentations, client negotiations, or conference calls. New scenarios added weekly.',
    color: 'from-primary/20 to-primary/5',
    borderColor: 'border-primary/30',
    dotColor: 'bg-primary',
    accent: 'text-primary',
  },
  {
    step: '02',
    emoji: '🎤',
    title: 'Speak, get scored instantly',
    description:
      "NVIDIA Riva AI analyzes your pronunciation, tone, pace, and clarity in real-time. You'll see exactly which sounds to improve and hear native examples.",
    color: 'from-nvidia/20 to-nvidia/5',
    borderColor: 'border-nvidia/30',
    dotColor: 'bg-nvidia',
    accent: 'text-nvidia',
  },
  {
    step: '03',
    emoji: '🔥',
    title: 'Build your streak',
    description:
      "Come back tomorrow, unlock harder scenarios, climb the weekly leaderboard. The more you practice, the more natural you sound — guaranteed in 30 days.",
    color: 'from-orange-500/20 to-orange-500/5',
    borderColor: 'border-orange-500/30',
    dotColor: 'bg-orange-500',
    accent: 'text-orange-400',
  },
]

export function HowItWorks() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/3 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16 space-y-4">
          <span className="text-primary text-sm font-semibold uppercase tracking-widest">
            How it works
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
            Fluency in 3 minutes a day
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            No grammar drills. No textbooks. Just real business conversations
            with instant AI feedback — the way your brain learns best.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line (desktop) */}
          <div className="hidden md:block absolute top-1/2 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-primary/40 via-nvidia/40 to-orange-500/40 -translate-y-1/2 z-0" />

          {steps.map((step, index) => (
            <div
              key={step.step}
              className={`relative z-10 group flex flex-col gap-5 p-7 rounded-3xl bg-gradient-to-br ${step.color} border ${step.borderColor} hover-glow transition-all duration-300`}
            >
              {/* Step number and emoji */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-5xl leading-none font-black ${step.accent} opacity-20 select-none`}
                >
                  {step.step}
                </span>
                <span className="text-4xl">{step.emoji}</span>
              </div>

              {/* Node dot */}
              <div
                className={`hidden md:block absolute -left-3 top-1/2 -translate-y-1/2 w-3 h-3 ${step.dotColor} rounded-full ring-4 ring-background shadow-lg`}
              />
              {index < steps.length - 1 && (
                <div
                  className={`hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 w-3 h-3 ${step.dotColor} rounded-full ring-4 ring-background shadow-lg`}
                />
              )}

              {/* Content */}
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white group-hover:text-slate-100 transition-colors">
                  {step.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-slate-400 text-base mb-2">
            Thousands of professionals have transformed their English.
          </p>
          <p className="text-white font-semibold text-lg">
            Your turn starts today — for free.
          </p>
        </div>
      </div>
    </section>
  )
}
