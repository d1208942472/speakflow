export const DEFAULT_PUBLIC_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.NEXT_PUBLIC_CANONICAL_SITE_URL ||
  'https://speakmeteor.win'

export function getSiteUrl(): string {
  return DEFAULT_PUBLIC_SITE_URL
}
