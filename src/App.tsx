import { useEffect, useState } from 'react'
import { Experience } from './scene/Experience'
import { bakeReference } from './scene/bakeTrial'
import type { RoomMode } from './scene/layout'
import { DiaryOverlay } from './ui/DiaryOverlay'
import { navigate, useRoute } from './route'
import { site } from './content/site'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from './ui/LanguageSwitcher'

export default function App() {
  const { t } = useTranslation()
  const { view } = useRoute()
  const [mode, setMode] = useState<RoomMode>(() => bakeReference && new URLSearchParams(window.location.search).get('mode') === 'night' ? 'night' : 'day')

  // Esc 回到房间
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && window.location.hash.replace(/^#\/?/, '') !== '') navigate('/')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (view === 'room') document.title = site.title
    if (view === 'computer') document.title = `${t('hud.computer')} · ${site.title}`
  }, [view, t])

  return (
    <div className="app">
      <Experience mode={mode} />

      {!bakeReference && <header className="hud">
        <div className="brand">
          <span className="brand-emoji">🏠</span>
          <b>{site.title}</b>
        </div>
        <div className="hud-actions">
          <LanguageSwitcher />
          {view === 'room' ? (
            <button
              className="back room-mode"
              aria-label={t('hud.nightMode')}
              aria-pressed={mode === 'night'}
              onClick={() => setMode((current) => current === 'day' ? 'night' : 'day')}
            >
              {mode === 'day' ? `☀️ ${t('hud.day')}` : `🌙 ${t('hud.night')}`}
            </button>
          ) : (
            <button className="back" onClick={() => navigate('/')}>
              ← {t('hud.back')} <kbd>Esc</kbd>
            </button>
          )}
        </div>
      </header>}

      {!bakeReference && view === 'room' && <div className="hint">{t('hud.hint')}</div>}

      <DiaryOverlay />

      {!bakeReference && <div className="mobile-note">{t('hud.mobile')}</div>}
    </div>
  )
}
