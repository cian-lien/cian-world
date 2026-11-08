import { useEffect, type MouseEvent } from 'react'
import { navigate, postHref, useRoute } from '../route'
import { posts } from '../content/posts'
import { site } from '../content/site'
import { playRoomSound } from '../sound'
import { useTranslation } from 'react-i18next'
import { useLocale } from '../i18n'
import { LanguageSwitcher } from './LanguageSwitcher'

/**
 * 点击日记本后出现的 2D 阅读层：左页是目录，右页是正文。
 * 正文用普通 DOM 渲染（而不是贴在 3D 里），阅读体验和可访问性都更好。
 */
export function DiaryOverlay() {
  const { t } = useTranslation()
  const locale = useLocale()
  const { view, slug } = useRoute()
  const post = slug ? posts.find((p) => p.slug === slug) : undefined

  useEffect(() => {
    if (view === 'diary') document.title = post ? `${post.title} · ${site.title}` : `${t('diary.title')} · ${site.title}`
  }, [view, post, t])

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
          <div className="diary-heading">
            <h2 className="hand">📔 {t('diary.title')}</h2>
            <LanguageSwitcher />
          </div>
          <p className="muted">{t('diary.count', { count: posts.length })}</p>
          {locale === 'en' && <p className="original-language-note">{t('diary.originalLanguage')}</p>}
          <ul className="post-list">
            {posts.map((p) => (
              <li key={p.slug} className={p.slug === slug ? 'active' : ''}>
                <a href={postHref(p.slug)} onClick={(event) => turnPage(event, p.slug)}>
                  <span className="date">{p.date}</span>
                  <span className="title" lang="zh-CN">{p.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="page page-right" key={slug ?? 'index'}>
          {post ? (
            <article lang="zh-CN">
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
            <p className="empty">{t('diary.missing', { slug })}</p>
          ) : (
            <div className="welcome">
              <h1 className="hand">{t('diary.welcome')}</h1>
              <p>{t('diary.intro')}</p>
              {posts[0] && (
                <a className="latest" href={postHref(posts[0].slug)} onClick={(event) => turnPage(event, posts[0].slug)}>
                  {t('diary.latest', { title: posts[0].title })}
                </a>
              )}
            </div>
          )}
        </section>

        <button className="diary-close" onClick={() => navigate('/')} aria-label={t('diary.close')}>
          ×
        </button>
      </div>
    </div>
  )
}
