import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { setLocale, useLocale } from '../i18n'
import { locales, localeNames, type Locale } from '../i18n/locale'

export function LanguageSwitcher() {
  const { t } = useTranslation()
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const container = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const menu = useRef<HTMLDivElement>(null)
  const options = useRef<Array<HTMLButtonElement | null>>([])
  const initialFocus = useRef(0)
  const menuId = useId()
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0, maxHeight: 0 })

  const contains = (target: EventTarget | null) => target instanceof Node
    && (container.current?.contains(target) || menu.current?.contains(target))

  useLayoutEffect(() => {
    if (!open) return
    const position = () => {
      const anchor = trigger.current?.getBoundingClientRect()
      if (!anchor) return
      const width = Math.min(184, window.innerWidth - 24)
      const height = menu.current?.scrollHeight ?? 112
      setMenuPosition({
        left: Math.max(12, Math.min(anchor.right - width, window.innerWidth - width - 12)),
        top: Math.max(12, Math.min(anchor.bottom + 12, window.innerHeight - height - 12)),
        maxHeight: Math.max(44, window.innerHeight - 24),
      })
    }
    position()
    options.current[initialFocus.current]?.focus()
    window.addEventListener('resize', position)
    window.addEventListener('scroll', position, true)
    return () => {
      window.removeEventListener('resize', position)
      window.removeEventListener('scroll', position, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown, true)
    return () => document.removeEventListener('pointerdown', onPointerDown, true)
  }, [open])

  const show = (index = locales.indexOf(locale)) => {
    initialFocus.current = index
    setOpen(true)
    if (open) options.current[index]?.focus()
  }

  const dismiss = () => {
    setOpen(false)
    trigger.current?.focus()
  }

  const select = (language: Locale) => {
    if (language !== locale) setLocale(language)
    dismiss()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = options.current.findIndex(option => option === event.target)
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      event.stopPropagation()
      dismiss()
    } else if (event.key === 'Tab' && open) {
      // Restore the trigger before the browser advances to the next/previous control.
      dismiss()
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      show(open && index >= 0 ? (index + direction + locales.length) % locales.length : locales.indexOf(locale))
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault()
      show(event.key === 'Home' ? 0 : locales.length - 1)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (index >= 0) select(locales[index])
      else if (open) dismiss()
      else show()
    } else if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      const match = locales.findIndex(language => localeNames[language].toLowerCase().startsWith(event.key.toLowerCase()))
      if (match >= 0) {
        event.preventDefault()
        show(match)
      }
    }
  }

  return (
    <div
      ref={container}
      className="language-switcher"
      onKeyDown={onKeyDown}
      onBlur={event => {
        if (!contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <button
        ref={trigger}
        type="button"
        className="language-trigger"
        role="combobox"
        aria-label={`${t('language.label')}: ${localeNames[locale]}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => open ? dismiss() : show()}
      >
        <span className="language-icon" aria-hidden="true">🌐</span>
        <span className="language-current" lang={locale}>{localeNames[locale]}</span>
        <span className="language-chevron" aria-hidden="true" />
      </button>
      {open && createPortal(
        <div ref={menu} id={menuId} className="language-menu" role="listbox" aria-label={t('language.label')} style={menuPosition}>
          {locales.map((language, index) => (
            <button
              key={language}
              ref={element => { options.current[index] = element }}
              type="button"
              className="language-option"
              role="option"
              aria-selected={language === locale}
              lang={language}
              tabIndex={-1}
              onClick={() => select(language)}
            >
              <span>{localeNames[language]}</span>
              {language === locale && <span className="language-check" aria-hidden="true">✓</span>}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  )
}
