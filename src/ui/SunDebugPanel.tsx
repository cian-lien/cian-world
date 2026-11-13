import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import type { useRoomSun } from '../scene/useRoomSun'

export function SunDebugPanel({ clock, sky, onView }: {
  clock: ReturnType<typeof useRoomSun>
  sky: boolean
  onView(sky: boolean): void
}) {
  const { t } = useTranslation()
  const slider = useId()
  const heading = useId()
  const { year, month, day, hour, minute } = clock.wall
  const date = [year, month, day].map(part => String(part).padStart(2, '0')).join('-')
  const time = [hour, minute].map(part => String(part).padStart(2, '0')).join(':')

  return <section className="sun-debug" aria-labelledby={heading}>
    <div className="sun-debug-heading">
      <h2 id={heading}>{t('sun.debug')}</h2>
      <span>{t(clock.previewing ? 'sun.preview' : 'sun.live')}</span>
    </div>
    <p>{clock.location ? clock.location.city ?? clock.zone : t('sun.estimated')} · {date}</p>
    <p>{t('sun.altitude')} {clock.sun.altitude.toFixed(1)}° · {t('sun.azimuth')} {clock.sun.azimuth.toFixed(1)}°</p>
    <div className="sun-debug-time">
      <label htmlFor={slider}>{t('sun.localTime')}</label>
      <time dateTime={clock.time.toISOString()}>{time}</time>
    </div>
    <input id={slider} type="range" min="0" max="1439" step="1" value={clock.minute}
      aria-valuetext={time} onChange={event => clock.setMinute(Number(event.currentTarget.value))} />
    <div className="sun-debug-actions">
      <div role="group" aria-label={t('sun.view')}>
        <button type="button" aria-pressed={!sky} onClick={() => onView(false)}>{t('sun.room')}</button>
        <button type="button" aria-pressed={sky} onClick={() => onView(true)}>{t('sun.sky')}</button>
      </div>
      <button type="button" disabled={!clock.previewing} onClick={clock.followReal}>{t('sun.restore')}</button>
    </div>
  </section>
}
