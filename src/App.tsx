import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { installAudio, setAudioRoomMode } from './audio/browser'
import { site } from './content/site'
import { navigate, useRoute } from './route'
import { Experience } from './scene/Experience'
import { bakeReference } from './scene/bakeTrial'
import type { RoomMode } from './scene/layout'
import { DiaryOverlay } from './ui/DiaryOverlay'
import { LanguageSwitcher } from './ui/LanguageSwitcher'
import { SoundButton } from './ui/SoundButton'

const modeStorageKey = 'room-blog.mode.v1'

function initialMode(): RoomMode {
  if (bakeReference) return new URLSearchParams(location.search).get('mode') === 'night' ? 'night' : 'day'
  try {
    if (localStorage.getItem(modeStorageKey) === 'night') return 'night'
  } catch { /* The room can still switch modes without storage. */ }
  return 'day'
}

export default function App() {
  const { t } = useTranslation()
  const { view } = useRoute()
  const [mode, setMode] = useState(initialMode)
  const [sceneError, setSceneError] = useState(false)

  useEffect(() => {
    if (!bakeReference) return installAudio()
  }, [])
  useEffect(() => {
    if (!bakeReference) setAudioRoomMode(mode)
  }, [mode])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented && !document.querySelector('[data-overlay]') && view !== 'room') navigate('/')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [view])

  useEffect(() => {
    if (view === 'room') document.title = site.title
    if (view === 'computer') document.title = `${t('hud.computer')} · ${site.title}`
  }, [view, t])

  function toggleMode() {
    const next = mode === 'day' ? 'night' : 'day'
    setMode(next)
    try { localStorage.setItem(modeStorageKey, next) } catch { /* Keep the in-memory choice. */ }
  }

  return (
    <div className="app">
      <Experience mode={mode} onError={() => setSceneError(true)} />
      {!bakeReference && <>
        <header className="hud">
          <div className="brand"><span className="brand-emoji">🏠</span><b>{site.title}</b></div>
          <div className="hud-actions">
            <LanguageSwitcher />
            <SoundButton />
            {view === 'room' ? (
              <button className="back room-mode" aria-label={t('hud.nightMode')}
                aria-pressed={mode === 'night'} onClick={toggleMode}>
                {mode === 'day' ? `☀️ ${t('hud.day')}` : `🌙 ${t('hud.night')}`}
              </button>
            ) : (
              <button className="back" onClick={() => navigate('/')}>
                ← {t('hud.back')} <kbd>Esc</kbd>
              </button>
            )}
          </div>
        </header>
        {view === 'room' && <div className="hint">{t('hud.hint')}</div>}
        {sceneError && <div className="scene-error" role="alert">
          <p>{t('hud.roomLoadError')}</p>
          <button className="paper-button" onClick={() => location.reload()}>{t('environment.retry')}</button>
        </div>}
        <div className="mobile-note">{t('hud.mobile')}</div>
      </>}
      <DiaryOverlay />
    </div>
  )
}
