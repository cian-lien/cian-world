import { useEffect, type MouseEvent } from 'react'
import { postHref, useRoute } from '../route'
import { posts } from '../content/posts'
import { site } from '../content/site'
import { playRoomSound } from '../sound'
import { useTranslation } from 'react-i18next'
import { useLocale } from '../i18n'
import { ContentDialog } from './ContentDialog'

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
    <ContentDialog title={t('diary.title')} pageKey={slug ?? 'index'} wide>
      <div className="diary-book" data-reading={slug !== null}>
        <section className="page page-left" aria-label={t('navigation.articles')}>
          <p className="muted">{t('diary.count', { count: posts.length })}</p>
          {locale === 'en' && <p className="original-language-note">{t('diary.originalLanguage')}</p>}
          <ul className="post-list">
            {posts.map((p) => (
              <li key={p.slug} className={p.slug === slug ? 'active' : ''}>
                <a href={postHref(p.slug)} aria-current={p.slug === slug ? 'page' : undefined}
                  onClick={(event) => turnPage(event, p.slug)}>
                  <span className="date">{p.date}</span>
                  <span className="title" lang="zh-CN">{p.title}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="page page-right" key={slug ?? 'index'}>
          {slug && <a className="diary-back-to-list" href="#/diary">← {t('diary.backToList')}</a>}
          {post ? (
            <article lang="zh-CN">
              <h2 className="hand article-title" data-reading-heading tabIndex={-1}>{post.title}</h2>
              <div className="meta">
                {post.date}
                {post.tags.map((t) => (
                  <span key={t} className="chip">#{t}</span>
                ))}
              </div>
              <div className="md" dangerouslySetInnerHTML={{ __html: post.html }} />
            </article>
          ) : slug ? (
            <p className="empty" data-reading-heading tabIndex={-1}>{t('diary.missing', { slug })}</p>
          ) : (
            <div className="welcome">
              <h2 className="hand">{t('diary.welcome')}</h2>
              <p>{t('diary.intro')}</p>
              {posts[0] && (
                <a className="latest" href={postHref(posts[0].slug)} onClick={(event) => turnPage(event, posts[0].slug)}>
                  {t('diary.latest', { title: posts[0].title })}
                </a>
              )}
            </div>
          )}
        </section>

      </div>
    </ContentDialog>
  )
}
