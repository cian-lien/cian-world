export function srgbToLab(rgb) {
  const [r, g, b] = rgb.map(channel => {
    const s = channel / 255
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  const labCurve = t => t > (6 / 29) ** 3 ? Math.cbrt(t) : t / (3 * (6 / 29) ** 2) + 4 / 29
  const x = labCurve((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047)
  const y = labCurve(0.2126729 * r + 0.7151522 * g + 0.0721750 * b)
  const z = labCurve((0.0193339 * r + 0.1191920 * g + 0.9503041 * b) / 1.08883)
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)]
}

// Sharma, Wu and Dalal (2005), with unit parametric factors.
// https://hajim.rochester.edu/ece/sites/gsharma/ciede2000/
export function deltaE2000([l1, a1, b1], [l2, a2, b2]) {
  const rad = Math.PI / 180
  const cos = degrees => Math.cos(degrees * rad)
  const mean = (a, b) => (a + b) / 2
  const chromaWeight = c => Math.sqrt(c ** 7 / (c ** 7 + 25 ** 7))
  const c = mean(Math.hypot(a1, b1), Math.hypot(a2, b2))
  const g = (1 - chromaWeight(c)) / 2
  const ap1 = a1 * (1 + g)
  const ap2 = a2 * (1 + g)
  const cp1 = Math.hypot(ap1, b1)
  const cp2 = Math.hypot(ap2, b2)
  const hue = (a, b) => (Math.atan2(b, a) / rad + 360) % 360
  const h1 = hue(ap1, b1)
  const h2 = hue(ap2, b2)
  const product = cp1 * cp2
  let dh = h2 - h1
  if (!product) dh = 0
  else if (dh > 180) dh -= 360
  else if (dh < -180) dh += 360

  const dl = l2 - l1
  const dc = cp2 - cp1
  const dH = 2 * Math.sqrt(product) * Math.sin(dh * rad / 2)
  const lightness = mean(l1, l2) - 50
  const chroma = mean(cp1, cp2)
  let h = mean(h1, h2)
  if (!product) h = h1 + h2
  else if (Math.abs(h1 - h2) > 180) h += h < 180 ? 180 : -180

  const t = 1 - 0.17 * cos(h - 30) + 0.24 * cos(2 * h) + 0.32 * cos(3 * h + 6) - 0.20 * cos(4 * h - 63)
  const sl = 1 + 0.015 * lightness ** 2 / Math.sqrt(20 + lightness ** 2)
  const sc = 1 + 0.045 * chroma
  const sh = 1 + 0.015 * chroma * t
  const rotation = 30 * Math.exp(-(((h - 275) / 25) ** 2))
  const rt = -2 * chromaWeight(chroma) * Math.sin(2 * rotation * rad)
  return Math.sqrt((dl / sl) ** 2 + (dc / sc) ** 2 + (dH / sh) ** 2 + rt * (dc / sc) * (dH / sh))
}
