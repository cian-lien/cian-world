import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { installAudio, setAudioRoomMode } from './audio/browser'
import { site } from './content/site'
import { navigate, useRoute } from './route'
import { Experience } from './scene/Experience'
import { bakeReference, debugRoomSun, liveRoomSun } from './scene/bakeTrial'
import type { RoomMode } from './scene/layout'
import { useRoomSun } from './scene/useRoomSun'
import { DiaryOverlay } from './ui/DiaryOverlay'
import { LanguageSwitcher } from './ui/LanguageSwitcher'
import { SoundButton } from './ui/SoundButton'
import { SunDebugPanel } from './ui/SunDebugPanel'

const modeStorageKey = 'room-blog.mode.v1'

function initialMode(): RoomMode {
  if (liveRoomSun) return 'day'
  if (bakeReference) return new URLSearchParams(location.search).get('mode') === 'night' ? 'night' : 'day'
  try {
    if (localStorage.getItem(modeStorageKey) === 'night') return 'night'
  } catch { /* The room can still switch modes without storage. */ }
  return 'day'
}

export default function App() {
  const { t } = useTranslation()
  const { view } = useRoute()
  const [legacyMode, setMode] = useState(initialMode)
  const [sceneError, setSceneError] = useState(false)
  const [sky, setSky] = useState(false)
  const clock = useRoomSun(liveRoomSun)
  const skyPreview = debugRoomSun && sky && view === 'room'
  const mode: RoomMode = liveRoomSun ? (clock.phase === 'night' ? 'night' : 'day') : legacyMode

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
    if (view === 'room' || view === 'window') document.title = site.title
    if (view === 'computer') document.title = `${t('hud.computer')} · ${site.title}`
  }, [view, t])

  function toggleMode() {
    const next = mode === 'day' ? 'night' : 'day'
    setMode(next)
    try { localStorage.setItem(modeStorageKey, next) } catch { /* Keep the in-memory choice. */ }
  }

  const time = [clock.wall.hour, clock.wall.minute].map(part => String(part).padStart(2, '0')).join(':')

  return (
    <div className="app">
      <Experience mode={mode} sun={liveRoomSun ? clock.sun : undefined} skyPreview={skyPreview}
        sunPreviewing={clock.previewing} onError={() => setSceneError(true)} />
      {!bakeReference && <>
        <header className="hud">
          <div className="brand"><span className="brand-emoji">🏠</span><b>{site.title}</b></div>
          <div className="hud-actions">
            <LanguageSwitcher />
            <SoundButton />
            {view === 'room' && liveRoomSun ? (
              <div className="room-clock" data-phase={clock.phase} title={clock.location?.city ?? t('sun.localTime')}>
                <time dateTime={clock.time.toISOString()}>{time}</time>
                <span>{t(`sun.${clock.phase}`)}</span>
                {!clock.location && <small>{t('sun.estimated')}</small>}
              </div>
            ) : view === 'room' ? (
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
        {view === 'room' && !debugRoomSun && <div className="hint">{t('hud.hint')}</div>}
        {(view === 'room' || view === 'window') && debugRoomSun && <SunDebugPanel clock={clock} sky={skyPreview}
          onView={next => { if (view === 'window') navigate('/'); setSky(next) }} />}
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
