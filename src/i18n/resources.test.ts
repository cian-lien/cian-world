import { createInstance } from 'i18next'
import { describe, expect, it } from 'vitest'
import { resources, zhCN, en } from './resources'

function flatten(value: object, prefix = ''): Record<string, string> {
  return Object.fromEntries(Object.entries(value).flatMap(([key, item]) => {
    const path = prefix ? `${prefix}.${key}` : key
    return typeof item === 'string' ? [[path, item]] : Object.entries(flatten(item, path))
  }))
}

describe('translated UI contract', () => {
  it('provides nonempty translations with matching keys and interpolation variables', () => {
    const chinese = flatten(zhCN)
    const english = flatten(en)
    expect(Object.keys(english).sort()).toEqual(Object.keys(chinese).sort())
    for (const key of Object.keys(chinese)) {
      expect(english[key].trim(), key).not.toBe('')
      expect(english[key].match(/{{\w+}}/g) ?? [], key).toEqual(chinese[key].match(/{{\w+}}/g) ?? [])
    }
  })

  it('renders localized article counts and interpolated terminal output', async () => {
    const instance = createInstance()
    await instance.init({ resources, lng: 'en', fallbackLng: 'zh-CN', interpolation: { escapeValue: false } })
    expect(instance.t('diary.count', { count: 0 })).toBe('0 entries')
    expect(instance.t('diary.count', { count: 1 })).toBe('1 entry')
    expect(instance.t('diary.count', { count: 3 })).toBe('3 entries')
    expect(instance.t('terminal.unknown', { command: '<hello>' })).toBe('Command not found: <hello> (type help for commands)')
    await instance.changeLanguage('zh-CN')
    expect(instance.t('diary.count', { count: 1 })).toBe('共 1 篇')
  })
})
