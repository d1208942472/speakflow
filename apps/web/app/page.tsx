import { HeroSection } from '@/components/HeroSection'
import { SocialProof } from '@/components/SocialProof'
import { HowItWorks } from '@/components/HowItWorks'
import { FeaturesSection } from '@/components/FeaturesSection'
import { PricingSection } from '@/components/PricingSection'
import { FAQSection } from '@/components/FAQSection'
import { FooterSection } from '@/components/FooterSection'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-background overflow-x-hidden">
      <HeroSection />
      <SocialProof />
      <HowItWorks />
      <FeaturesSection />
      <PricingSection />
      <FAQSection />
      <FooterSection />
    </main>
  )
}
