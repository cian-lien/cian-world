import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { installAudio, setAudioRoomMode } from './audio/browser'
import { site } from './content/site'
import { navigate, useRoute } from './route'
import { bakeReference, debugRoomSun, liveRoomSun } from './scene/bakeTrial'
import type { RoomMode } from './scene/layout'
import { useRoomSun } from './scene/useRoomSun'
import { playRoomSound } from './sound'
import { DiaryOverlay } from './ui/DiaryOverlay'
import { LanguageSwitcher } from './ui/LanguageSwitcher'
import { SoundButton } from './ui/SoundButton'
import { SunDebugPanel } from './ui/SunDebugPanel'
import { SceneBoundary } from './ui/SceneBoundary'
import { SiteContent } from './ui/SiteContent'

const modeStorageKey = 'room-blog.mode.v1'
const Experience = lazy(() => import('./scene/Experience').then(module => ({ default: module.Experience })))
const contentLinks = { diary: 'articles', projects: 'projects', about: 'about' } as const
const isContentView = (view: string): view is keyof typeof contentLinks =>
  view === 'diary' || view === 'projects' || view === 'about'

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
  const contentOpen = isContentView(view)
  const [visitedRoom, setVisitedRoom] = useState(!contentOpen)
  const previousView = useRef(view)
  const contentNav = useRef<HTMLElement>(null)
  const [pointerEntry, setPointerEntry] = useState<{ path: string; waitingForMove: boolean } | null>(null)
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
    const previous = previousView.current
    previousView.current = view
    if (!contentOpen) setVisitedRoom(true)
    if (view === 'room' && isContentView(previous) && document.activeElement === document.body) {
      contentNav.current?.querySelector<HTMLElement>(`a[href="#/${previous}"]`)?.focus()
    }
  }, [view, contentOpen])

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
    <div className={contentOpen ? 'app content-open' : 'app'}>
      {(visitedRoom || !contentOpen || bakeReference) && <SceneBoundary onError={() => setSceneError(true)}>
        <Suspense fallback={null}>
          <Experience mode={mode} sun={liveRoomSun ? clock.sun : undefined} skyPreview={skyPreview}
            cloudPreviewTime={clock.previewing ? clock.time.getTime() : undefined} sunPreviewing={clock.previewing}
            onError={() => setSceneError(true)} />
        </Suspense>
      </SceneBoundary>}
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
        {(view === 'room' || (contentOpen && visitedRoom)) && <div className={`room-entry${debugRoomSun ? ' room-entry-debug' : ''}`}>
          <nav className="room-nav" ref={contentNav} aria-label={t('navigation.label')}
            onBlur={() => { if (!contentOpen) setPointerEntry(null) }}
            onKeyDown={event => { if (event.key !== 'Escape') setPointerEntry(null) }}>
            {Object.entries(contentLinks).map(([path, label]) => (
              <a key={path} href={`#/${path}`}
                data-pointer-entry={pointerEntry?.path === path ? '' : undefined}
                data-waiting-for-move={pointerEntry?.path === path && pointerEntry.waitingForMove ? '' : undefined}
                onPointerMove={() => {
                  if (!contentOpen && pointerEntry?.path === path && pointerEntry.waitingForMove) {
                    setPointerEntry({ path, waitingForMove: false })
                  }
                }}
                onClick={event => {
                  if (event.defaultPrevented || event.button !== 0 || event.ctrlKey ||
                    event.metaKey || event.shiftKey || event.altKey) return
                  // Escape can reveal the restored focus ring even when the modal was opened by a click.
                  setPointerEntry(event.detail > 0 ? { path, waitingForMove: true } : null)
                  if (path === 'diary') playRoomSound('diary')
                }}>
                <span>{t(`navigation.${label}`)}</span>
              </a>
            ))}
          </nav>
          {!debugRoomSun && !sceneError && <>
            <p className="hint">{t('hud.hint')}</p>
            <p className="mobile-note">{t('hud.mobile')}</p>
          </>}
        </div>}
        {(view === 'room' || view === 'window') && debugRoomSun && <SunDebugPanel clock={clock} sky={skyPreview}
          onView={next => { if (view === 'window') navigate('/'); setSky(next) }} />}
        {sceneError && <div className="scene-error" role="alert">
          <p>{t('hud.roomLoadError')}</p>
          <button className="paper-button" onClick={() => location.reload()}>{t('environment.retry')}</button>
        </div>}
      </>}
      <DiaryOverlay />
      {(view === 'projects' || view === 'about') && <SiteContent view={view} />}
    </div>
  )
}
