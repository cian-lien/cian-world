import { useEffect, useState } from 'react'
import { Experience } from './scene/Experience'
import { bakeReference } from './scene/bakeTrial'
import type { RoomMode } from './scene/layout'
import { DiaryOverlay } from './ui/DiaryOverlay'
import { navigate, useRoute } from './route'
import { site } from './content/site'

export default function App() {
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
    if (view === 'room') document.title = `${site.name} 的房间`
    if (view === 'computer') document.title = `电脑 · ${site.name} 的房间`
  }, [view])

  return (
    <div className="app">
      <Experience mode={mode} />

      {!bakeReference && <header className="hud">
        <div className="brand">
          <span className="brand-emoji">🏠</span>
          <b>{site.name}</b> 的房间
        </div>
        {view === 'room' ? (
          <button
            className="back room-mode"
            aria-label="夜景模式"
            aria-pressed={mode === 'night'}
            onClick={() => setMode((current) => current === 'day' ? 'night' : 'day')}
          >
            {mode === 'day' ? '☀️ 日景' : '🌙 夜景'}
          </button>
        ) : (
          <button className="back" onClick={() => navigate('/')}>
            ← 返回房间 <kbd>Esc</kbd>
          </button>
        )}
      </header>}

      {!bakeReference && view === 'room' && <div className="hint">点点房间里的东西：日记本、电脑、台灯，还有猫 🐾 · 拖动可以转动视角</div>}

      <DiaryOverlay />

      {!bakeReference && <div className="mobile-note">移动端适配还在计划中，建议用电脑浏览器访问 🖥️</div>}
    </div>
  )
}
