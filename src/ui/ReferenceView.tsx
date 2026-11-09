import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { createEnvironmentStore } from '../env/store'
import { useLocale } from '../i18n'
import { Experience } from '../scene/Experience'
import './ReferenceView.css'

const presets = {
  day: { image: 'rooftop-day-summer.png', size: [918, 852], time: '02:00', weather: 'clear', temperature: '30', humidity: '65', zh: '白天 · 夏至', en: 'Day · Summer solstice' },
  night: { image: 'rooftop-night-rain.png', size: [571, 487], time: '13:00', weather: 'rain', temperature: '25', humidity: '94', zh: '雨夜', en: 'Rainy night' },
} as const

export default function ReferenceView({ variant }: { variant: keyof typeof presets }) {
  const preset = presets[variant]
  const zh = useLocale() === 'zh-CN'
  const [opacity, setOpacity] = useState(50)
  const [visible, setVisible] = useState(true)
  const [failed, setFailed] = useState(false)
  const store = useMemo(() => {
    // The environment resolver uses UTC when coordinates have no live location.
    const date = '2026-06-22'
    const search = new URLSearchParams({ date, time: preset.time, weather: preset.weather,
      temperature: preset.temperature, humidity: preset.humidity, wind: '2', lat: '23.1', lon: '113.3' })
    return createEnvironmentStore({
      now: () => new Date(`${date}T${preset.time}:00Z`),
      clock: { timeZone: 'UTC', deviceTimeZone: 'UTC' },
      getSearch: () => search.toString(),
    })
  }, [preset])

  useEffect(() => {
    const title = document.title
    document.title = `${zh ? preset.zh : preset.en} · ${zh ? '天台对照' : 'Rooftop reference'}`
    return () => { document.title = title }
  }, [preset, zh])

  useEffect(() => {
    const toggle = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== 'r' || event.defaultPrevented || event.repeat || event.isComposing ||
        event.ctrlKey || event.altKey || event.metaKey ||
        (event.target instanceof HTMLElement && event.target.closest('input:not([type="range"]),textarea,select,[contenteditable]')) ||
        document.querySelector('[data-overlay],dialog[open]')) return
      setVisible(value => !value)
    }
    window.addEventListener('keydown', toggle)
    return () => window.removeEventListener('keydown', toggle)
  }, [])

  const [width, height] = preset.size
  const environment = store.getSnapshot()
  return <main className="reference-view" aria-label={zh ? '天台对照' : 'Rooftop reference'}>
    <div className="reference-frame" data-reference-frame={variant}
      data-time={environment.time.toISOString()} data-weather={environment.weather.kind}
      data-phase={environment.phase} data-term={environment.solarTerm.id}
      style={{ '--reference-ratio': width / height } as CSSProperties}>
      <Experience mode={variant} referenceStore={store} onError={() => setFailed(true)} />
      <img className="reference-image" src={`${import.meta.env.BASE_URL}docs/reference/${preset.image}`}
        alt={zh ? preset.zh : preset.en} hidden={!visible} style={{ opacity: opacity / 100 }} onError={() => setFailed(true)} />
    </div>
    <div className="reference-controls">
      <strong>{zh ? preset.zh : preset.en}</strong>
      <button type="button" aria-pressed={visible} aria-keyshortcuts="R" onClick={() => setVisible(value => !value)}>
        {zh ? '参考图' : 'Reference image'} <kbd>R</kbd>
      </button>
      <label>
        {zh ? '透明度' : 'Opacity'}
        <input type="range" min={0} max={100} step={1} value={opacity}
          onChange={event => setOpacity(event.currentTarget.valueAsNumber)} />
        <output>{opacity}%</output>
      </label>
      {failed && <span role="alert">{zh ? '对照场景加载失败' : 'Could not load the reference scene'}</span>}
    </div>
  </main>
}
