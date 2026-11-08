export const locales = ['zh-CN', 'en'] as const
export type Locale = typeof locales[number]
export const defaultLocale: Locale = 'zh-CN'
export const localeNames: Record<Locale, string> = { 'zh-CN': '简体中文', en: 'English' }
export const localeStorageKey = 'room-blog.locale.v1'

export function normalizeLocale(value: string | null | undefined): Locale | undefined {
  const language = value?.toLowerCase().split('-')[0]
  if (language === 'zh') return 'zh-CN'
  if (language === 'en') return 'en'
}

export function resolveLocale(search: string, saved: string | null, languages: readonly string[]): Locale {
  return normalizeLocale(new URLSearchParams(search).get('lang'))
    ?? normalizeLocale(saved)
    ?? languages.map(normalizeLocale).find((locale) => locale !== undefined)
    ?? defaultLocale
}

export function withLocale(href: string, locale: Locale): string {
  const url = new URL(href)
  url.searchParams.set('lang', locale)
  return url.href
}
