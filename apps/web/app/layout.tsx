import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import './globals.css'
import { getSiteUrl } from '../lib/site'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const siteUrl = getSiteUrl()
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'SpeakFlow — AI Business English Coach | Powered by NVIDIA',
    template: '%s | SpeakFlow',
  },
  description:
    'Master business English in 3 minutes a day. Real-time AI pronunciation scoring powered by NVIDIA. Duolingo-style streaks, job interview prep, and negotiation practice. Now in early access — free for founding members.',
  keywords: [
    'business English',
    'AI English coach',
    'pronunciation scoring',
    'NVIDIA AI',
    'English speaking practice',
    'job interview English',
    'ESL app',
    'non-native English speakers',
    'English fluency',
    'language learning app',
  ],
  authors: [{ name: 'SpeakFlow' }],
  creator: 'SpeakFlow',
  publisher: 'SpeakFlow',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/apple-touch-icon.svg', type: 'image/svg+xml' }],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'SpeakFlow',
    title: 'SpeakFlow — AI Business English Coach | Powered by NVIDIA',
    description:
      'Master business English in 3 minutes a day. Real-time AI pronunciation scoring powered by NVIDIA. Now in early access — free for founding members.',
    images: [
      {
        url: '/opengraph-image.svg',
        width: 1200,
        height: 630,
        alt: 'SpeakFlow — AI Business English Coach',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SpeakFlow — AI Business English Coach | Powered by NVIDIA',
    description:
      'Master business English in 3 minutes a day. Real-time AI pronunciation scoring powered by NVIDIA.',
    images: ['/opengraph-image.svg'],
    creator: '@speakflowai',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  themeColor: '#0F0F1A',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        {/* Google Analytics */}
        {gaMeasurementId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}', {
                  page_path: window.location.pathname,
                });
              `}
            </Script>
          </>
        )}
        {/* Structured Data */}
        <Script id="structured-data" type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'SpeakFlow',
            applicationCategory: 'EducationApplication',
            operatingSystem: 'iOS, Android',
            description:
              'AI-powered business English speaking coach with real-time pronunciation scoring powered by NVIDIA.',
            offers: [
              {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                name: 'Free Plan',
              },
              {
                '@type': 'Offer',
                price: '79.99',
                priceCurrency: 'USD',
                name: 'Annual Pro Plan',
                billingIncrement: 'P1Y',
              },
            ],
          })}
        </Script>
      </head>
      <body className="bg-background text-slate-100 antialiased">
        {children}
      </body>
    </html>
  )
}
