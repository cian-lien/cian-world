import { isHuinantian } from './humidity'
import type { EnvironmentState } from './types'
import { clamp01, normalizeDegrees } from './weather'

export interface VisualEnvironment {
  rain: number; snow: number; fog: number; cloudCover: number; wetness: number; snowCover: number
  windSpeed: number; windDirection: number; dayProgress: number
}
export function toVisualEnvironment(state: EnvironmentState): VisualEnvironment {
  const w = state.weather, damp=isHuinantian(w,state.solarTerm.index), wet = ['drizzle', 'rain', 'thunderstorm', 'sleet'].includes(w.kind)
  return { rain: wet ? w.intensity : 0, snow: w.kind === 'snow' || w.kind === 'sleet' ? w.intensity : 0,
    fog: w.kind === 'fog' ? w.intensity : damp ? .38 : wet ? .08 * w.intensity : 0, cloudCover: w.cloudCover,
    wetness: wet ? w.intensity : damp ? .72 : 0, snowCover: w.kind === 'snow' ? w.intensity : 0,
    windSpeed: w.windSpeed, windDirection: w.windDirection, dayProgress: state.dayProgress }
}
export function sampleTransition(from: VisualEnvironment, to: VisualEnvironment, elapsedMs: number): VisualEnvironment {
  const t = clamp01(elapsedMs / 4000)
  if (t === 0) return { ...from }
  if (t === 1) return { ...to }
  const out = { ...from }
  for (const key of Object.keys(from) as (keyof VisualEnvironment)[]) out[key] = from[key] + (to[key] - from[key]) * t
  const angle = (a: number, b: number) => normalizeDegrees(a + (normalizeDegrees(b - a + 180) - 180) * t)
  out.windDirection = angle(from.windDirection, to.windDirection)
  out.dayProgress = angle(from.dayProgress * 360, to.dayProgress * 360) / 360
  return out
}
export function createVisualTransition(initial: VisualEnvironment, nowMs: number) {
  let from = { ...initial }, target = { ...initial }, startedAt = nowMs
  const sample = (time: number) => sampleTransition(from, target, time - startedAt)
  return { sample, setTarget(next: VisualEnvironment, time: number) { from = sample(time); target = { ...next }; startedAt = time } }
}
