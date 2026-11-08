import { defaultLocale, type Locale } from '../i18n/locale'

type Localized<T> = Record<Locale, T>

// 共用身份与技术名称不翻译。描述性内容与对应记录一起维护，项目/书签以 id 标识。
const identity = {
  name: 'Cian Lien',
  title: 'Cian Lien’s World',
  avatar: '🧑‍💻',
  skills: ['TypeScript', 'React', 'Three.js', 'Node.js', 'SQL', 'Blender'],
}

const profile: Localized<{ role: string; bio: string; location: string }> = {
  'zh-CN': {
    role: '全栈开发工程师',
    bio: '前端出身，正在系统地补后端。喜欢做有意思的网页，这里收藏我的作品、文章与生活记录。',
    location: '广州',
  },
  en: {
    role: 'Full-stack developer',
    bio: 'I started in frontend development and am now building a stronger backend foundation. I enjoy making interesting web experiences. This is where I collect my projects, writing, and everyday moments.',
    location: 'Guangzhou',
  },
}

interface ProjectConfig {
  id: string
  name: string | Localized<string>
  desc: Localized<string>
  tech: string[]
  url: string
}

const projects: ProjectConfig[] = [
  {
    id: 'world',
    name: identity.title,
    desc: {
      'zh-CN': '从一间 3D 房间开始的个人世界，展示我的作品、个人介绍与文章。',
      en: 'A personal world that starts in a 3D room, showcasing my projects, profile, and writing.',
    },
    tech: ['R3F', 'Three.js', 'Blender', 'Markdown'],
    url: 'https://github.com/',
  },
  {
    id: 'example-b',
    name: { 'zh-CN': '示例项目 B', en: 'Example project B' },
    desc: {
      'zh-CN': '在这里写一句话介绍你的项目，比如它解决了什么问题。',
      en: 'Add a short introduction to your project here, such as the problem it solves.',
    },
    tech: ['Node.js', 'PostgreSQL'],
    url: 'https://github.com/',
  },
  {
    id: 'example-c',
    name: { 'zh-CN': '示例项目 C', en: 'Example project C' },
    desc: {
      'zh-CN': '可以放公司项目的脱敏版介绍，或者自己的练手项目。',
      en: 'Share a sanitized overview of a work project or a personal learning project.',
    },
    tech: ['Vue', 'Express'],
    url: '',
  },
]

interface LinkConfig {
  id: string
  name: string | Localized<string>
  icon: string
  url: string
}

// Most sites prevent embedding, so bookmarks continue to open in a new tab.
const links: LinkConfig[] = [
  { id: 'github', name: 'GitHub', icon: '🐙', url: 'https://github.com/' },
  { id: 'juejin', name: { 'zh-CN': '掘金', en: 'Juejin' }, icon: '💎', url: 'https://juejin.cn/' },
  { id: 'threejs', name: 'Three.js', icon: '🧊', url: 'https://threejs.org/' },
  { id: 'email', name: { 'zh-CN': '邮箱', en: 'Email' }, icon: '✉️', url: 'mailto:you@example.com' },
]

const localize = (value: string | Localized<string>, locale: Locale) => typeof value === 'string' ? value : value[locale]

export function getSite(locale: Locale) {
  return {
    ...identity,
    ...profile[locale],
    projects: projects.map(project => ({ ...project, name: localize(project.name, locale), desc: project.desc[locale] })),
    links: links.map(link => ({ ...link, name: localize(link.name, locale) })),
  }
}

export type Site = ReturnType<typeof getSite>
// Keep shared branding and the existing default-language configuration available.
export const site = getSite(defaultLocale)
