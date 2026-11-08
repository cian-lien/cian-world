// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { setLocale } from '../i18n'
import { LanguageSwitcher } from './LanguageSwitcher'

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true })

let root: Root
let host: HTMLDivElement

function trigger() {
  const element = host.querySelector<HTMLButtonElement>('[role="combobox"]')
  if (!element) throw new Error('Missing language combobox')
  return element
}

function press(element: Element, key: string) {
  act(() => { element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })) })
}

beforeEach(() => {
  window.history.replaceState({ marker: 'keep' }, '', '/?bake=live&lang=en#/diary/hello-room')
  act(() => setLocale('en'))
  host = document.createElement('div')
  document.body.append(host)
  root = createRoot(host)
  act(() => root.render(<LanguageSwitcher />))
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
})

describe('language dropdown interactions', () => {
  it('selects a language, closes the menu and returns focus without losing the route or history state', () => {
    act(() => trigger().click())
    const chinese = document.querySelector<HTMLButtonElement>('[role="option"][lang="zh-CN"]')!
    expect(trigger().getAttribute('aria-expanded')).toBe('true')
    act(() => { chinese.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true })) })
    act(() => chinese.click())
    expect(document.documentElement.lang).toBe('zh-CN')
    expect(window.location.search).toBe('?bake=live&lang=zh-CN')
    expect(window.location.hash).toBe('#/diary/hello-room')
    expect(window.history.state).toEqual({ marker: 'keep' })
    expect(document.querySelector('[role="listbox"]')).toBeNull()
    expect(document.activeElement).toBe(trigger())
  })

  it('opens from the keyboard and moves focus with arrows, Home and End before committing', () => {
    press(trigger(), 'ArrowDown')
    const options = document.querySelectorAll<HTMLButtonElement>('[role="option"]')
    expect(document.activeElement).toBe(options[1])
    press(options[1], 'Home')
    expect(document.activeElement).toBe(options[0])
    press(options[0], 'End')
    expect(document.activeElement).toBe(options[1])
    press(options[1], 'ArrowUp')
    expect(document.activeElement).toBe(options[0])
    press(options[0], 'Enter')
    expect(document.documentElement.lang).toBe('zh-CN')
    expect(document.activeElement).toBe(trigger())
  })

  it('handles Escape locally so closing the menu does not trigger room navigation', () => {
    press(trigger(), 'ArrowDown')
    let escapedToWindow = false
    const onKey = () => { escapedToWindow = true }
    window.addEventListener('keydown', onKey)
    try {
      press(document.activeElement!, 'Escape')
      expect(escapedToWindow).toBe(false)
      expect(document.querySelector('[role="listbox"]')).toBeNull()
      expect(document.activeElement).toBe(trigger())
      expect(window.location.hash).toBe('#/diary/hello-room')
      expect(document.documentElement.lang).toBe('en')
    } finally {
      window.removeEventListener('keydown', onKey)
    }
  })

  it('dismisses on outside pointer input without selecting a language', () => {
    act(() => trigger().click())
    act(() => document.body.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true })))
    expect(document.querySelector('[role="listbox"]')).toBeNull()
    expect(document.documentElement.lang).toBe('en')
  })

  it('dismisses on Tab without preventing normal keyboard focus movement', () => {
    press(trigger(), 'ArrowDown')
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true })
    act(() => { document.activeElement!.dispatchEvent(event) })
    expect(event.defaultPrevented).toBe(false)
    expect(document.querySelector('[role="listbox"]')).toBeNull()
    expect(document.documentElement.lang).toBe('en')
  })

  it('renders the menu outside its trigger container so diary scrolling cannot clip the options', () => {
    host.style.overflow = 'hidden'
    act(() => trigger().click())
    const menu = document.querySelector('[role="listbox"]')
    expect(menu).not.toBeNull()
    expect(host.contains(menu)).toBe(false)
    expect(document.querySelectorAll('[role="option"]')).toHaveLength(2)
  })
})
