import { marked } from 'marked'

export interface Post {
  slug: string
  title: string
  date: string
  tags: string[]
  summary: string
  html: string
}

type FrontValue = string | string[]

/** 解析 Markdown 顶部的 frontmatter（只支持简单的 key: value 和 key: [a, b]） */
export function parseFrontmatter(raw: string): { data: Record<string, FrontValue>; body: string } {
  const data: Record<string, FrontValue> = {}
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!m) return { data, body: raw }

  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':')
    if (i < 0) continue
    const key = line.slice(0, i).trim()
    const value = line.slice(i + 1).trim()
    if (value.startsWith('[') && value.endsWith(']')) {
      data[key] = value
        .slice(1, -1)
        .split(',')
        .map((s) => unquote(s.trim()))
        .filter(Boolean)
    } else {
      data[key] = unquote(value)
    }
  }
  return { data, body: raw.slice(m[0].length) }
}

const unquote = (s: string) => s.replace(/^["']|["']$/g, '')
const str = (v: FrontValue | undefined) => (Array.isArray(v) ? v.join(', ') : v ?? '')

/** files: { '/content/posts/hello.md': '原始 markdown 文本' } */
export function buildPosts(files: Record<string, string>): Post[] {
  return Object.entries(files)
    .map(([path, raw]) => {
      const slug = path.split('/').pop()!.replace(/\.md$/, '')
      const { data, body } = parseFrontmatter(raw)
      if (str(data.draft) === 'true') return null
      const tags = Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : []
      return {
        slug,
        title: str(data.title) || slug,
        date: str(data.date),
        tags,
        summary: str(data.summary),
        html: marked.parse(body, { async: false }) as string,
      } satisfies Post
    })
    .filter((p): p is Post => p !== null)
    .sort((a, b) => b.date.localeCompare(a.date))
}
