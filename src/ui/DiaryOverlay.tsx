import { useEffect, type MouseEvent } from 'react'
import { navigate, postHref, useRoute } from '../route'
import { posts } from '../content/posts'
import { site } from '../content/site'
import { playRoomSound } from '../sound'

/**
 * 点击日记本后出现的 2D 阅读层：左页是目录，右页是正文。
 * 正文用普通 DOM 渲染（而不是贴在 3D 里），阅读体验和可访问性都更好。
 */
export function DiaryOverlay() {
  const { view, slug } = useRoute()
  const post = slug ? posts.find((p) => p.slug === slug) : undefined

  useEffect(() => {
    if (view === 'diary') document.title = post ? `${post.title} · ${site.title}` : `日记本 · ${site.title}`
  }, [view, post])

  if (view !== 'diary') return null

  const turnPage = (event: MouseEvent<HTMLAnchorElement>, nextSlug: string) => {
    if (nextSlug === slug || event.defaultPrevented || event.button !== 0 ||
      event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    playRoomSound('page')
  }

  return (
    <div className="diary-backdrop" onClick={() => navigate('/')}>
      <div className="diary-book" onClick={(e) => e.stopPropagation()}>
        <section className="page page-left">
          <h2 className="hand">📔 日记本</h2>
          <p className="muted">共 {posts.length} 篇</p>
          <ul className="post-list">
            {posts.map((p) => (
              <li key={p.slug} className={p.slug === slug ? 'active' : ''}>
                <a href={postHref(p.slug)} onClick={(event) => turnPage(event, p.slug)}>
                  <span className="date">{p.date}</span>
                  <span className="title">{p.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="page page-right" key={slug ?? 'index'}>
          {post ? (
            <article>
              <h1 className="hand">{post.title}</h1>
              <div className="meta">
                {post.date}
                {post.tags.map((t) => (
                  <span key={t} className="chip">#{t}</span>
                ))}
              </div>
              <div className="md" dangerouslySetInnerHTML={{ __html: post.html }} />
            </article>
          ) : slug ? (
            <p className="empty">这一页被撕掉了……找不到「{slug}」。</p>
          ) : (
            <div className="welcome">
              <h1 className="hand">欢迎翻开我的日记本</h1>
              <p>左边是目录，点一篇开始读吧。</p>
              {posts[0] && (
                <a className="latest" href={postHref(posts[0].slug)} onClick={(event) => turnPage(event, posts[0].slug)}>
                  最新：{posts[0].title} →
                </a>
              )}
            </div>
          )}
        </section>

        <button className="diary-close" onClick={() => navigate('/')} aria-label="合上日记本">
          ×
        </button>
      </div>
    </div>
  )
}
