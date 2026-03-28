import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog — SpeakFlow | Business English Tips & AI Updates',
  description: 'Business English tips, NVIDIA AI updates, and pronunciation coaching insights from the SpeakFlow team.',
}

const featuredPosts = [
  {
    title: 'How NVIDIA Riva ASR Gives You Pronunciation Scores in Real Time',
    excerpt: 'A deep dive into the speech recognition technology powering SpeakFlow\'s instant pronunciation feedback, and why it outperforms traditional language apps.',
    category: 'NVIDIA AI',
    readTime: '5 min read',
    date: 'Mar 15, 2026',
    emoji: '🎤',
    slug: '/blog/how-nvidia-riva-asr-scores-pronunciation',
  },
  {
    title: '10 Business English Phrases That Will Get You Promoted',
    excerpt: 'The most impactful professional English phrases for meetings, presentations, and negotiations — with practice tips from our AI coach Max.',
    category: 'English Tips',
    readTime: '7 min read',
    date: 'Mar 8, 2026',
    emoji: '💼',
  },
  {
    title: 'Why Non-Native Speakers Lose Jobs to Less-Qualified Candidates',
    excerpt: 'Research shows language confidence gaps cost professionals promotions even when their skills exceed native speakers. Here\'s how to close that gap.',
    category: 'Career Growth',
    readTime: '6 min read',
    date: 'Feb 28, 2026',
    emoji: '📈',
  },
  {
    title: 'The Science of Pronunciation Learning: Why Streaks Work',
    excerpt: 'Spaced repetition + daily practice + immediate feedback: the neuroscience behind why SpeakFlow\'s Duolingo-style approach builds lasting fluency.',
    category: 'Learning Science',
    readTime: '8 min read',
    date: 'Feb 20, 2026',
    emoji: '🧠',
  },
  {
    title: 'Job Interview English: The Ultimate Guide for Non-Native Speakers',
    excerpt: 'From "Tell me about yourself" to salary negotiation — master the exact phrases and pronunciation patterns that impress hiring managers.',
    category: 'English Tips',
    readTime: '12 min read',
    date: 'Feb 10, 2026',
    emoji: '🏆',
  },
  {
    title: 'SpeakFlow Joins NVIDIA Inception Program',
    excerpt: 'We\'re proud to announce SpeakFlow has been accepted into the NVIDIA Inception Program, accelerating our AI-powered English coaching platform.',
    category: 'Company News',
    readTime: '3 min read',
    date: 'Jan 20, 2026',
    emoji: '🎉',
  },
]

const categories = ['All', 'NVIDIA AI', 'English Tips', 'Career Growth', 'Learning Science', 'Company News']

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b border-border/50 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">S</span>
            </div>
            <span className="text-white font-bold text-xl">SpeakFlow</span>
          </Link>
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">
            &larr; Home
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">
          SpeakFlow <span className="text-primary">Blog</span>
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl">
          Business English tips, AI pronunciation science, and career growth strategies for non-native professionals.
        </p>
      </section>

      {/* Category filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 mb-10">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span
              key={cat}
              className={`px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer transition-all ${
                cat === 'All'
                  ? 'bg-primary text-white'
                  : 'bg-card border border-border text-slate-400 hover:text-white hover:border-primary/50'
              }`}
            >
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* Posts grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredPosts.map((post) => {
            const CardWrapper = post.slug
              ? ({ children }: { children: React.ReactNode }) => (
                  <Link href={post.slug!} className="block">{children}</Link>
                )
              : ({ children }: { children: React.ReactNode }) => <>{children}</>
            return (
              <CardWrapper key={post.title}>
                <article
                  className="bg-card border border-border rounded-3xl p-6 hover:border-primary/50 transition-all duration-200 hover:shadow-card group cursor-pointer h-full"
                >
                  <div className="text-4xl mb-4">{post.emoji}</div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-primary text-xs font-semibold bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                      {post.category}
                    </span>
                    <span className="text-slate-500 text-xs">{post.readTime}</span>
                  </div>
                  <h2 className="text-white font-bold text-lg leading-snug mb-3 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">{post.excerpt}</p>
                  <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between">
                    <span className="text-slate-500 text-xs">{post.date}</span>
                    {post.slug && (
                      <span className="text-primary text-xs font-medium">Read →</span>
                    )}
                  </div>
                </article>
              </CardWrapper>
            )
          })}
        </div>

        {/* Newsletter CTA */}
        <div className="mt-16 bg-card border border-primary/30 rounded-3xl p-8 sm:p-12 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Get weekly English tips</h2>
          <p className="text-slate-400 mb-6 max-w-md mx-auto">
            Be the first to get our weekly business English tips and product updates.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-primary"
              readOnly
            />
            <button className="bg-primary hover:bg-primary-dark text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm whitespace-nowrap">
              Subscribe Free
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 text-center">
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
