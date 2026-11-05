import { bakeTrialUrl } from './bakeTrial'

type RGB = [number, number, number]
type Probe = { x: number; y: number; linear: RGB; encoded: RGB }
type ColorManifest = {
  scale: number
  resolution: number | { light: number }
  probes: Record<string, Probe[]>
}

export async function checkBakeColors(url = bakeTrialUrl) {
  const response = await fetch(`${url}manifest.json`)
  if (!response.ok) throw new Error(`Could not load bake manifest: ${response.status}`)
  const manifest: ColorManifest = await response.json()
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = typeof manifest.resolution === 'number' ? manifest.resolution : manifest.resolution.light
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Could not open a 2D canvas for bake color verification')

  const decode = (byte: number) => {
    const srgb = byte / 255
    return manifest.scale * (srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4)
  }

  const samples = []
  for (const [filename, probes] of Object.entries(manifest.probes)) {
    const image = new Image()
    image.src = url + filename
    await image.decode()
    context.drawImage(image, 0, 0)
    for (const { x, y, linear, encoded } of probes) {
      const bytes = context.getImageData(x, y, 1, 1).data.slice(0, 3)
      const absolute = Array.from(bytes, (byte, i) => Math.abs(decode(byte) - linear[i]))
      const relative = Math.hypot(...absolute) / Math.hypot(...linear)
      samples.push({
        filename, x, y, relative,
        bytesMatch: bytes.every((byte, i) => byte === encoded[i]),
        maxChannelRelative: Math.max(...absolute.map((error, i) => linear[i] > 0 ? error / linear[i] : 0)),
      })
    }
  }
  return {
    count: samples.length,
    passed: samples.length > 0 && samples.every(sample => sample.bytesMatch && sample.relative < 0.02),
    meanRelative: samples.reduce((total, sample) => total + sample.relative, 0) / samples.length,
    maxRelative: Math.max(...samples.map(sample => sample.relative)),
    maxChannelRelative: Math.max(...samples.map(sample => sample.maxChannelRelative)),
    samples,
  }
}
