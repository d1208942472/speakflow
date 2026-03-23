const industries = [
  { name: 'Tech & Engineering', emoji: '💻' },
  { name: 'Finance & Banking', emoji: '📈' },
  { name: 'Sales & Business Dev', emoji: '🤝' },
  { name: 'Healthcare', emoji: '🏥' },
  { name: 'Academia & Research', emoji: '🎓' },
  { name: 'Manufacturing', emoji: '🏭' },
]

const features = [
  {
    value: '11',
    label: 'NVIDIA AI Models',
    icon: '⚡',
    color: 'text-nvidia',
  },
  {
    value: '25',
    label: 'Languages Supported',
    icon: '🌍',
    color: 'text-white',
  },
  {
    value: '5',
    label: 'Business Scenarios',
    icon: '💼',
    color: 'text-white',
  },
  {
    value: 'Free',
    label: 'Early Access Tier',
    icon: '🚀',
    color: 'text-primary',
  },
]

export function SocialProof() {
  return (
    <section className="relative py-16 border-y border-border/50">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-card/30" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Designed for text */}
        <div className="text-center">
          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mb-8">
            Designed for non-native professionals in
          </p>

          {/* Industries */}
          <div className="flex flex-wrap justify-center items-center gap-4 lg:gap-6">
            {industries.map((industry) => (
              <div
                key={industry.name}
                className="flex items-center gap-2 bg-card/50 border border-border/50 rounded-full px-4 py-2 hover:border-primary/30 transition-colors duration-200"
              >
                <span>{industry.emoji}</span>
                <span className="text-slate-400 hover:text-slate-300 font-medium text-sm transition-colors duration-200 select-none">
                  {industry.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 max-w-xl mx-auto">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-border" />
          <div className="w-1.5 h-1.5 bg-primary/50 rounded-full" />
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-border" />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1 p-4 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 transition-colors duration-200"
            >
              <span className="text-2xl mb-1">{stat.icon}</span>
              <span className={`text-2xl lg:text-3xl font-extrabold ${stat.color}`}>
                {stat.value}
              </span>
              <span className="text-slate-400 text-sm text-center">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
