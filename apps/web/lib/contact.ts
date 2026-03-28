export const CONTACT_EMAIL =
  process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'hello@speakmeteor.win'

export const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@speakmeteor.win'

export const PRIVACY_EMAIL =
  process.env.NEXT_PUBLIC_PRIVACY_EMAIL || 'privacy@speakmeteor.win'

export const LEGAL_EMAIL =
  process.env.NEXT_PUBLIC_LEGAL_EMAIL || 'legal@speakmeteor.win'

export function toMailto(email: string, subject?: string): string {
  if (!subject) {
    return `mailto:${email}`
  }

  return `mailto:${email}?subject=${encodeURIComponent(subject)}`
}
