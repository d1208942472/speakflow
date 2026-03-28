export const DEFAULT_PUBLIC_API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://api.speakmeteor.win'

export function getApiUrl(path = ''): string {
  const base = DEFAULT_PUBLIC_API_URL.replace(/\/+$/, '')
  if (!path) return base
  return `${base}${path.startsWith('/') ? path : `/${path}`}`
}
