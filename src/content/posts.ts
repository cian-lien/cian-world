import { buildPosts } from './parsePosts'

// 构建时把 content/posts 下所有 .md 读成字符串。新增文章只需要往这个文件夹里放 .md。
const files = import.meta.glob('/content/posts/*.md', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

export const posts = buildPosts(files)
export type { Post } from './parsePosts'
