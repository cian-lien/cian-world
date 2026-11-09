import { useEffect, useRef, useState, type ReactNode } from 'react'
import { navigate, postHref } from '../route'
import { playRoomSound } from '../sound'
import { posts } from '../content/posts'
import { getSite } from '../content/site'
import { useTranslation } from 'react-i18next'
import { useLocale } from '../i18n'

/**
 * 仿桌面系统「RoomOS」：显示在电脑屏幕里的一个普通 React 组件。
 * 桌面图标 → 打开窗口；窗口可拖动、置顶、关闭；底部任务栏有时钟和「离开电脑」按钮。
 */

type AppId = 'about' | 'projects' | 'browser' | 'terminal'

interface AppDef {
  id: AppId | 'blog'
  icon: string
}

const APPS: AppDef[] = [
  { id: 'about', icon: '📄' },
  { id: 'projects', icon: '📁' },
  { id: 'browser', icon: '🌐' },
  { id: 'terminal', icon: '⌨️' },
  { id: 'blog', icon: '📔' },
]

const SIZES: Record<AppId, { w: number; h: number }> = {
  about: { w: 460, h: 340 },
  projects: { w: 560, h: 380 },
  browser: { w: 600, h: 380 },
  terminal: { w: 520, h: 320 },
}

interface Win {
  id: AppId
  x: number
  y: number
  z: number
}

export function Desktop({ active }: { active: boolean }) {
  const { t } = useTranslation()
  const [wins, setWins] = useState<Win[]>([{ id: 'about', x: 300, y: 70, z: 1 }])
  const zTop = useRef(1)
  const rootRef = useRef<HTMLDivElement>(null)

  const focus = (id: AppId) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, z: ++zTop.current } : w)))

  const open = (app: AppDef) => {
    if (app.id === 'blog') {
      playRoomSound('diary')
      navigate('/diary')
      return
    }
    const id = app.id
    setWins((ws) => {
      if (ws.some((w) => w.id === id)) return ws.map((w) => (w.id === id ? { ...w, z: ++zTop.current } : w))
      const n = ws.length
      return [...ws, { id, x: 200 + n * 36, y: 50 + n * 30, z: ++zTop.current }]
    })
  }

  const close = (id: AppId) => setWins((ws) => ws.filter((w) => w.id !== id))
  const move = (id: AppId, x: number, y: number) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, x, y } : w)))

  return (
    <div ref={rootRef} className={`desktop ${active ? 'is-active' : ''}`} onClickCapture={(event) => {
      if (active && event.detail > 0) playRoomSound('computer')
    }}>
      <div className="wallpaper" />

      <div className="icons">
        {APPS.map((app) => (
          <button key={app.id} className="icon" onClick={() => open(app)}>
            <span className="icon-emoji">{app.icon}</span>
            <span className="icon-name">{t(`desktop.${app.id}`)}</span>
          </button>
        ))}
      </div>

      {wins.map((w) => (
        <Window
          key={w.id}
          win={w}
          title={t(`desktop.${w.id}`)}
          size={SIZES[w.id]}
          rootRef={rootRef}
          onFocus={() => focus(w.id)}
          onClose={() => close(w.id)}
          onMove={(x, y) => move(w.id, x, y)}
        >
          {w.id === 'about' && <AboutApp />}
          {w.id === 'projects' && <ProjectsApp />}
          {w.id === 'browser' && <BrowserApp />}
          {w.id === 'terminal' && <TerminalApp />}
        </Window>
      ))}

      <Taskbar wins={wins} onPick={(id) => focus(id)} />
    </div>
  )
}

/* ---------------- 窗口 ---------------- */

interface WindowProps {
  win: Win
  title: string
  size: { w: number; h: number }
  rootRef: React.RefObject<HTMLDivElement>
  onFocus: () => void
  onClose: () => void
  onMove: (x: number, y: number) => void
  children: ReactNode
}

function Window({ win, title, size, rootRef, onFocus, onClose, onMove, children }: WindowProps) {
  const { t } = useTranslation()
  const startDrag = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button')) return
    e.preventDefault()
    onFocus()
    const root = rootRef.current
    if (!root) return
    // 桌面被 3D 变换缩放过，需要把屏幕上的鼠标位移换算回桌面内部的像素
    const scale = root.getBoundingClientRect().width / root.offsetWidth || 1
    const sx = e.clientX
    const sy = e.clientY
    const ox = win.x
    const oy = win.y
    const maxX = root.offsetWidth - 80
    const maxY = root.offsetHeight - 70
    const onMoveEv = (ev: PointerEvent) => {
      const x = Math.min(maxX, Math.max(-size.w + 80, ox + (ev.clientX - sx) / scale))
      const y = Math.min(maxY, Math.max(0, oy + (ev.clientY - sy) / scale))
      onMove(x, y)
    }
    const onUp = () => {
      window.removeEventListener('pointermove', onMoveEv)
      window.removeEventListener('pointerup', onUp)
    }
    window.addEventListener('pointermove', onMoveEv)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div
      className="window"
      style={{ left: win.x, top: win.y, width: size.w, height: size.h, zIndex: win.z }}
      onPointerDown={onFocus}
    >
      <div className="titlebar" onPointerDown={startDrag}>
        <span className="dots">
          <button className="dot red" onClick={onClose} aria-label={t('desktop.close')} />
          <span className="dot yellow" />
          <span className="dot green" />
        </span>
        <span className="win-title">{title}</span>
      </div>
      <div className="win-body">{children}</div>
    </div>
  )
}

function Taskbar({ wins, onPick }: { wins: Win[]; onPick: (id: AppId) => void }) {
  const { t } = useTranslation()
  const locale = useLocale()
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 10_000)
    return () => window.clearInterval(timer)
  }, [])
  const time = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(now)

  return (
    <div className="taskbar">
      <button className="start" onClick={() => navigate('/')}>
        🏠 {t('desktop.leave')}
      </button>
      <div className="tasks">
        {wins.map((w) => (
          <button key={w.id} className="task" onClick={() => onPick(w.id)}>
            {t(`desktop.${w.id}`)}
          </button>
        ))}
      </div>
      <span className="clock">
        {time}
      </span>
    </div>
  )
}

/* ---------------- 应用 ---------------- */

function AboutApp() {
  const site = getSite(useLocale())
  return (
    <div className="about">
      <div className="avatar">{site.avatar}</div>
      <h3>{site.name}</h3>
      <p className="muted">
        {site.role} · {site.location}
      </p>
      <p>{site.bio}</p>
      <div className="chips">
        {site.skills.map((s) => (
          <span key={s} className="chip">
            {s}
          </span>
        ))}
      </div>
    </div>
  )
}

function ProjectsApp() {
  const { t } = useTranslation()
  const site = getSite(useLocale())
  return (
    <div className="projects">
      {site.projects.map((p) => (
        <div key={p.id} className="card">
          <div className="card-head">
            <b>📦 {p.name}</b>
            {p.url && (
              <a href={p.url} target="_blank" rel="noreferrer">
                {t('desktop.view')}
              </a>
            )}
          </div>
          <p>{p.desc}</p>
          <div className="chips">
            {p.tech.map((t) => (
              <span key={t} className="chip">
                {t}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function BrowserApp() {
  const { t } = useTranslation()
  const site = getSite(useLocale())
  return (
    <div className="browser">
      <div className="addr">🔒 roomos://bookmarks</div>
      <div className="bookmarks">
        {site.links.map((l) => (
          <a key={l.id} className="bookmark" href={l.url} target="_blank" rel="noreferrer">
            <span className="bm-icon">{l.icon}</span>
            <span>{l.name}</span>
          </a>
        ))}
      </div>
      <p className="muted small">{t('desktop.bookmarks')}</p>
    </div>
  )
}

const COMMANDS = ['help', 'whoami', 'ls', 'cat', 'projects', 'date', 'clear', 'exit'] as const

function TerminalApp() {
  const { t } = useTranslation()
  const locale = useLocale()
  const site = getSite(locale)
  const [lines, setLines] = useState<string[]>([])
  const [showGreeting, setShowGreeting] = useState(true)
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)

  // 只滚动终端自身（不要用 scrollIntoView，它会连带滚动外层页面）
  useEffect(() => {
    const box = boxRef.current
    if (box) box.scrollTop = box.scrollHeight
  }, [lines])

  const run = (raw: string) => {
    const [cmd, ...args] = raw.trim().split(/\s+/)
    const out: string[] = [`$ ${raw}`]
    switch (cmd) {
      case '':
        break
      case 'help':
        out.push(...COMMANDS.map(command => `${(command === 'cat' ? 'cat <N>' : command).padEnd(12)}${t(`terminal.${command}`)}`))
        break
      case 'whoami':
        out.push(`${site.name} —— ${site.role}`, site.bio)
        break
      case 'ls':
        if (!posts.length) out.push(t('terminal.empty'))
        posts.forEach((p, i) => out.push(`${String(i + 1).padStart(2, ' ')}. ${p.date}  ${p.title}`))
        break
      case 'cat': {
        const p = posts[Number(args[0]) - 1]
        if (p) {
          out.push(t('terminal.opening', { title: p.title }))
          window.setTimeout(() => (window.location.hash = postHref(p.slug)), 400)
        } else out.push(t('terminal.usage'))
        break
      }
      case 'projects':
        site.projects.forEach((p) => out.push(`📦 ${p.name} —— ${p.desc}`))
        break
      case 'date':
        out.push(new Date().toLocaleString(locale))
        break
      case 'sudo':
        out.push(t('terminal.denied'))
        break
      case 'clear':
        setLines([])
        setShowGreeting(false)
        return
      case 'exit':
        navigate('/')
        return
      default:
        out.push(t('terminal.unknown', { command: cmd }))
    }
    setLines((ls) => [...ls, ...out])
  }

  return (
    <div ref={boxRef} className="terminal" onClick={() => inputRef.current?.focus({ preventScroll: true })}>
      {showGreeting && <div className="term-line">{t('terminal.greeting')}</div>}
      {lines.map((l, i) => (
        <div key={i} className="term-line">
          {l}
        </div>
      ))}
      <form
        className="term-input"
        onSubmit={(e) => {
          e.preventDefault()
          run(input)
          setInput('')
        }}
      >
        <span>$&nbsp;</span>
        <input aria-label={t('desktop.terminalInput')} ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} spellCheck={false} autoComplete="off" />
      </form>
    </div>
  )
}
