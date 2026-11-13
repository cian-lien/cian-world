import { useEffect, useMemo, useState } from 'react'
import { defaultCoordinates, getSky } from '../env/astronomy'
import { getRoomEnvironment } from '../env/browser'
import { getWallClock } from '../env/clock'
import { useEnvironment, useEnvironmentStatus } from '../env/useEnvironment'
import { debugSunTime, type LocalDate } from './roomSun'

interface Preview {
  date: LocalDate
  minute: number
  zone: string
  location: ReturnType<typeof useEnvironment>['location']
}

export function useRoomSun(enabled: boolean) {
  const store = getRoomEnvironment()
  const state = useEnvironment(store)
  const { timeZone } = useEnvironmentStatus(store)
  const [preview, setPreview] = useState<Preview>()
  const zone = preview?.zone ?? timeZone
  const location = preview ? preview.location : state.location
  const time = useMemo(() => preview ? debugSunTime(preview.date, preview.minute, zone) : state.time,
    [preview, zone, state.time])
  const wall = getWallClock(time, zone)
  const { sun, phase } = useMemo(() => preview
    ? getSky(time, location ?? defaultCoordinates, location ? undefined : getWallClock(time, zone))
    : state, [preview, time, location, zone, state])

  useEffect(() => {
    if (enabled) return store.start()
  }, [enabled, store])

  useEffect(() => {
    const location = state.location
    if (location) setPreview(current => current && !current.location
      ? { ...current, location, zone: timeZone }
      : current)
  }, [state.location, timeZone])

  return {
    sun, phase, time, wall, zone, location,
    minute: preview?.minute ?? wall.hour * 60 + wall.minute,
    previewing: Boolean(preview),
    setMinute(minute: number) {
      setPreview(previous => ({ date: wall, zone, location, ...previous, minute }))
    },
    followReal() { setPreview(undefined) },
  }
}
