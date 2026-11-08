import i18n from 'i18next'
import { initReactI18next, useTranslation } from 'react-i18next'
import { defaultLocale, locales, localeStorageKey, normalizeLocale, resolveLocale, withLocale, type Locale } from './locale'
import { resources } from './resources'
export type { Locale } from './locale'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: typeof resources['zh-CN']
  }
}

function detectLocale(): Locale {
  let saved: string | null = null
  try { saved = window.localStorage.getItem(localeStorageKey) } catch { /* Storage can be disabled. */ }
  return resolveLocale(window.location.search, saved, window.navigator.languages)
}

// Static resources initialize synchronously, also serving drei's independent DOM roots.
void i18n.use(initReactI18next).init({
  resources,
  lng: detectLocale(),
  fallbackLng: defaultLocale,
  supportedLngs: [...locales],
  load: 'currentOnly',
  initAsync: false,
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
})

function syncDocument(language: string) {
  const locale = normalizeLocale(language) ?? defaultLocale
  document.documentElement.lang = locale
  window.history.replaceState(window.history.state, '', withLocale(window.location.href, locale))
}
i18n.on('languageChanged', syncDocument)
syncDocument(i18n.language)

// A hash navigation can traverse an entry created under another language.
const restoreHistoryLocale = () => { void i18n.changeLanguage(detectLocale()) }
window.addEventListener('popstate', restoreHistoryLocale)

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    window.removeEventListener('popstate', restoreHistoryLocale)
    i18n.off('languageChanged', syncDocument)
  })
}

export function setLocale(locale: Locale) {
  try { window.localStorage.setItem(localeStorageKey, locale) } catch { /* URL persistence still works. */ }
  void i18n.changeLanguage(locale)
}

export function useLocale(): Locale {
  const { i18n: instance } = useTranslation()
  return normalizeLocale(instance.resolvedLanguage) ?? defaultLocale
}

export default i18n
