import { describe, expect, it } from 'vitest'
import { resolveLocale, withLocale } from './locale'

describe('language selection', () => {
  it.each([
    ['?lang=en', 'zh-CN', ['zh-CN'], 'en'],
    ['?lang=zh-CN', 'en', ['en-US'], 'zh-CN'],
    ['', 'en', ['zh-CN'], 'en'],
    ['', null, ['fr-FR', 'en-GB'], 'en'],
    ['', null, ['zh-TW', 'en-US'], 'zh-CN'],
    ['?lang=fr', 'en', ['zh-CN'], 'en'],
    ['?lang=invalid', 'invalid', ['de-DE'], 'zh-CN'],
    ['?lang=en-US', null, [], 'en'],
    ['', null, [], 'zh-CN'],
  ])('resolves %s / %s / %j to %s', (search, saved, languages, expected) => {
    expect(resolveLocale(search, saved, languages)).toBe(expected)
  })

  it('preserves subpaths, other parameters and encoded article hashes', () => {
    const url = withLocale('https://example.com/blog/?bake=live&mode=night#/diary/hello%20world', 'en')
    expect(url).toBe('https://example.com/blog/?bake=live&mode=night&lang=en#/diary/hello%20world')
    expect(withLocale(url, 'zh-CN')).toBe('https://example.com/blog/?bake=live&mode=night&lang=zh-CN#/diary/hello%20world')
  })
})
