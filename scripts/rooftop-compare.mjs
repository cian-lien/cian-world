import assert from 'node:assert/strict'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { arch, cpus, platform, release } from 'node:os'
import { resolve } from 'node:path'
import { parseArgs } from 'node:util'
import { chromium } from 'playwright-core'
import { PNG } from 'pngjs'
import { createServer } from 'vite'
import { deltaE2000, srgbToLab } from './rooftop-color.mjs'

const { values } = parseArgs({ options: {
  stage: { type: 'string', default: '1' },
  date: { type: 'string' },
  headed: { type: 'boolean', default: false },
} })
const date = values.date ?? new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai' }).format(new Date())
assert.match(date, /^\d{4}-\d{2}-\d{2}$/)
assert.match(values.stage, /^[0-4]$/)

const referenceDir = resolve(import.meta.dirname, '../docs/reference')
const output = resolve(referenceDir, 'compare')
const prefix = `${date}-stage-${values.stage}`
const points = JSON.parse(await readFile(resolve(referenceDir, `stage-${values.stage}-points.json`), 'utf8'))
const variants = [
  { id: 'day', title: '白天 · 夏至', file: 'rooftop-day-summer.png', weather: 'clear', phase: 'day', time: '02:00' },
  { id: 'night', title: '雨夜', file: 'rooftop-night-rain.png', weather: 'rain', phase: 'night', time: '13:00' },
]
const screenshotOptions = { scale: 'css', style: '.reference-controls { visibility: hidden !important; }' }
const inlineCode = value => '`' + value + '`'

function colorAt(png, [x, y]) {
  assert.ok(Number.isInteger(x) && Number.isInteger(y) && x > 0 && y > 0 && x < png.width - 1 && y < png.height - 1,
    `Invalid 3 × 3 sample center ${x},${y} for ${png.width} × ${png.height}`)
  return [0, 1, 2].map(channel => {
    const samples = []
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) samples.push(png.data[((y + dy) * png.width + x + dx) * 4 + channel])
    }
    return samples.sort((a, b) => a - b)[4]
  })
}

function compareColors(reference, actual, samples) {
  const hex = rgb => '#' + Buffer.from(rgb).toString('hex')
  assert.equal(samples.length, 20, 'Each scene requires 20 sample points')
  return samples.map(([label, ref, render]) => {
    const a = colorAt(reference, ref)
    const b = colorAt(actual, render)
    return { label, ref, render, referenceHex: hex(a), actualHex: hex(b), deltaE: deltaE2000(srgbToLab(a), srgbToLab(b)) }
  })
}

function compareOutlines(variant, composition, width) {
  const outlines = points.outlines?.[variant]
  if (!outlines) return []
  const rows = Object.entries(outlines).map(([key, { label, pixels }]) => {
    const actual = composition?.[key]
    assert.ok(actual?.length === pixels.length && actual.every(Number.isFinite), `Missing measured outline: ${key}`)
    const errors = actual.map((value, i) => value - pixels[i])
    const distances = key === 'stairCorners'
      ? errors.filter((_, i) => i % 2 === 0).map((dx, i) => Math.hypot(dx, errors[2 * i + 1]))
      : errors.map(Math.abs)
    const maximum = Math.max(...distances)
    return { label, pixels, actual, maximum, ratio: maximum / width }
  })
  if (values.stage === '1') {
    for (const row of rows) assert.ok(row.ratio <= .03, `${variant} ${row.label}: ${(row.ratio * 100).toFixed(2)}% exceeds 3%`)
  }
  return rows
}

function sideBySide(reference, actual) {
  const { width, height } = reference
  const result = new PNG({ width: 2 * width, height })
  PNG.bitblt(reference, result, 0, 0, width, height, 0, 0)
  PNG.bitblt(actual, result, 0, 0, width, height, width, 0)
  return PNG.sync.write(result)
}

async function capture(browser, base, variant, reference) {
  const { width, height } = reference
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 })
  const errors = []
  const isFavicon = url => new URL(url, base).pathname === '/favicon.ico'
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error' && !isFavicon(message.location().url)) errors.push(message.text())
  })
  page.on('response', response => {
    if (response.status() >= 400 && !isFavicon(response.url())) errors.push(`${response.status()} ${response.url()}`)
  })
  try {
    await page.goto(`${base}?ref=${variant.id}&lang=zh-CN`)
    const frame = page.locator(`[data-reference-frame="${variant.id}"]`)
    const overlay = frame.locator('img.reference-image')
    const controls = page.locator('.reference-controls')
    const slider = controls.getByRole('slider')
    await overlay.evaluate(image => image.decode())
    assert.equal(await overlay.evaluate(image => image.naturalWidth), width)
    assert.equal(await overlay.evaluate(image => image.naturalHeight), height)
    assert.equal(await frame.getAttribute('data-weather'), variant.weather)
    assert.equal(await frame.getAttribute('data-phase'), variant.phase)
    assert.equal(await frame.getAttribute('data-time'), `2026-06-22T${variant.time}:00.000Z`)
    if (variant.id === 'day') assert.equal(await frame.getAttribute('data-term'), 'xiazhi')
    await page.waitForFunction(() => window.__world?.stats().drawCalls > 0, null, { timeout: 60_000 })
    assert.equal(await slider.inputValue(), '50')
    assert.equal(await overlay.evaluate(image => getComputedStyle(image).opacity), '0.5')
    const composition = points.outlines ? await page.evaluate(() => window.__world.composition()) : null
    for (const [key, value] of [['Home', '0'], ['End', '1']]) {
      await slider.press(key)
      assert.equal(await overlay.evaluate(image => getComputedStyle(image).opacity), value)
    }
    await slider.press('r')
    assert.equal(await overlay.isHidden(), true)
    const toggle = controls.getByRole('button', { pressed: false })
    await toggle.click()
    assert.equal(await overlay.isVisible(), true)
    await page.keyboard.press('r')
    assert.equal(await overlay.isHidden(), true)

    assert.deepEqual(await frame.boundingBox(), { x: 0, y: 0, width, height })
    const first = PNG.sync.read(await frame.screenshot(screenshotOptions))
    // Let the existing 30-second renderer statistics window roll past startup.
    await new Promise(resolve => setTimeout(resolve, 32_000))
    const stats = await page.evaluate(() => window.__world.stats())
    const gpu = await frame.locator('canvas').evaluate(canvas => {
      const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
      const ext = gl?.getExtension('WEBGL_debug_renderer_info')
      return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl?.getParameter(gl.RENDERER) ?? 'Unknown'
    })
    const actual = PNG.sync.read(await frame.screenshot(screenshotOptions))
    assert.deepEqual([actual.width, actual.height], [width, height])
    assert.ok(first.data.equals(actual.data), `${variant.id} changed during the fixed capture`)
    assert.ok(stats.sampleSeconds >= 29 && stats.sampleSeconds <= 30, 'Expected a full renderer sample window')
    assert.deepEqual(errors, [], 'Browser errors during capture')
    return { actual, stats, gpu, composition }
  } finally {
    await page.close()
  }
}

const server = await createServer({ root: resolve(referenceDir, '../..'), server: { host: '127.0.0.1', port: 0 } })
let browser
try {
  await server.listen()
  const base = server.resolvedUrls.local[0]
  const executablePath = process.env.ROOFTOP_CHROME_PATH
  browser = await chromium.launch({ ...(executablePath ? { executablePath } : { channel: 'chrome' }),
    headless: !values.headed, args: ['--force-color-profile=srgb'] })
  const report = [
    `# 天台阶段 ${values.stage} 对照报告`, '',
    `${date}，${platform()} ${release()} ${arch()}，${cpus()[0].model}，Chrome ${browser.version()}（${values.headed ? '有窗口' : '无头'}模式）。`, '',
    '图左为概念原图，图右为网页渲染。每个标记用该图左上角为原点的像素坐标 `(x, y)`，取中心 3 × 3 区域各通道中位数，按 sRGB → D65 CIELAB → CIEDE2000 计算。两张图分别标记同一物件的表面。', '',
    '帧率来自 WebGL 渲染器预热后约 30 秒的统计窗口。固定机位与动画时间，像素比 1，质量档 2。', '',
  ]
  const images = []
  for (const variant of variants) {
    console.log(`Capturing ${variant.id} and sampling 30 seconds of frames…`)
    const reference = PNG.sync.read(await readFile(resolve(referenceDir, variant.file)))
    const { actual, stats, gpu, composition } = await capture(browser, base, variant, reference)
    const outlines = compareOutlines(variant.id, composition, actual.width)
    const colors = compareColors(reference, actual, points[variant.id])
    const mean = colors.reduce((sum, point) => sum + point.deltaE, 0) / colors.length
    const filename = `${prefix}-${variant.id}.png`
    images.push([filename, sideBySide(reference, actual)])
    report.push(`## ${variant.title}`, '',
      `[并排对比图](./${filename})，每侧 ${actual.width} × ${actual.height}。`, '',
      `平均 ΔE₀₀ **${mean.toFixed(2)}**，**${stats.fps.toFixed(1)} FPS**，${stats.drawCalls} 次绘制调用，${stats.sampleSeconds.toFixed(2)} 秒。`, '',
      `WebGL 渲染器 ${inlineCode(gpu)}。`, '')
    if (outlines.length) {
      const tilt = Math.asin(-stats.camera.direction[1]) * 180 / Math.PI
      report.push(`俯角 ${tilt.toFixed(1)}°，垂直视角 ${stats.camera.fov}°。在 50% 叠图下标记参考边界，计算渲染网格投影的四条边界与参考边界的最大距离。楼梯间顶盖另测四个角的直线距离。百分比以画面宽度为分母。`, '',
        '| 轮廓 | 原图像素坐标 | 渲染像素坐标 | 最大偏差 | 画面宽度占比 |',
        '| --- | --- | --- | ---: | ---: |',
        ...outlines.map(row => `| ${row.label} | ${row.pixels.join(', ')} | ${row.actual.map(x => x.toFixed(1)).join(', ')} | ${row.maximum.toFixed(1)} px | ${(100 * row.ratio).toFixed(2)}% |`), '')
    }
    report.push(
      '| 取样点 | 原图坐标 | 原图颜色 | 渲染坐标 | 渲染颜色 | ΔE₀₀ |',
      '| --- | --- | --- | --- | --- | ---: |',
      ...colors.map(p => `| ${p.label} | (${p.ref.join(', ')}) | ${inlineCode(p.referenceHex)} | (${p.render.join(', ')}) | ${inlineCode(p.actualHex)} | ${p.deltaE.toFixed(2)} |`), '')
    console.log(`${variant.id} ΔE₀₀ ${mean.toFixed(2)}, ${stats.fps.toFixed(1)} FPS, ${stats.drawCalls} draw calls`)
  }
  await mkdir(output, { recursive: true })
  for (const [filename, data] of images) await writeFile(resolve(output, filename), data)
  const reportPath = resolve(output, `${prefix}.md`)
  await writeFile(reportPath, report.join('\n'))
  console.log(reportPath)
} finally {
  await browser?.close()
  await server.close()
}
