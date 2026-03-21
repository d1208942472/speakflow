const companies = [
  { name: 'Google', abbr: 'G' },
  { name: 'Microsoft', abbr: 'M' },
  { name: 'Amazon', abbr: 'A' },
  { name: 'Goldman Sachs', abbr: 'GS' },
  { name: 'McKinsey', abbr: 'McK' },
  { name: 'Meta', abbr: 'Meta' },
  { name: 'Apple', abbr: 'Appl' },
]

const stats = [
  {
    value: '50K+',
    label: 'Lessons Completed',
    icon: '📚',
  },
  {
    value: '4.8★',
    label: 'App Rating',
    icon: '⭐',
  },
  {
    value: '89',
    label: 'Countries',
    icon: '🌍',
  },
  {
    value: 'NVIDIA',
    label: 'Powered',
    icon: '⚡',
  },
]

export function SocialProof() {
  return (
    <section className="relative py-16 border-y border-border/50">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-card/30" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Trusted by text */}
        <div className="text-center">
          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mb-8">
            Trusted by professionals from
          </p>

          {/* Company logos (text-based) */}
          <div className="flex flex-wrap justify-center items-center gap-8 lg:gap-12">
            {companies.map((company) => (
              <div
                key={company.name}
                className="group flex items-center justify-center"
              >
                <span className="text-slate-500 hover:text-slate-300 font-bold text-lg lg:text-xl tracking-tight transition-colors duration-200 select-none">
                  {company.name}
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
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1 p-4 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 transition-colors duration-200"
            >
              <span className="text-2xl mb-1">{stat.icon}</span>
              <span
                className={`text-2xl lg:text-3xl font-extrabold ${
                  stat.label === 'Powered'
                    ? 'text-nvidia'
                    : 'text-white'
                }`}
              >
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
