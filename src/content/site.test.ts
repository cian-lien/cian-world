import { describe, expect, it } from 'vitest'
import { getSite } from './site'

describe('localized profile and projects', () => {
  it('translates the profile and each stable project/bookmark identity', () => {
    const chinese = getSite('zh-CN')
    const english = getSite('en')
    expect(chinese.role).toBe('全栈开发工程师')
    expect(english.role).toBe('Full-stack developer')
    expect(english.projects.find(project => project.id === 'example-b')?.name).toBe('Example project B')
    expect(english.links.find(link => link.id === 'email')?.name).toBe('Email')
  })

  it('keeps shared identity, links and technologies attached to their stable IDs', () => {
    const chinese = getSite('zh-CN')
    const english = getSite('en')
    expect(english.name).toBe(chinese.name)
    expect(english.title).toBe(chinese.title)
    expect(english.avatar).toBe(chinese.avatar)
    expect(english.skills).toEqual(chinese.skills)
    expect(english.projects.map(project => [project.id, project.tech, project.url])).toEqual(chinese.projects.map(project => [project.id, project.tech, project.url]))
    expect(english.links.map(link => [link.id, link.icon, link.url])).toEqual(chinese.links.map(link => [link.id, link.icon, link.url]))
    expect(new Set(english.projects.map(project => project.id)).size).toBe(english.projects.length)
  })
})
