import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getSite } from '../content/site'
import { useLocale } from '../i18n'
import { ContentDialog } from './ContentDialog'

export function AboutProfile() {
  const site = getSite(useLocale())
  return (
    <div className="about">
      <div className="avatar" aria-hidden="true">{site.avatar}</div>
      <h2>{site.name}</h2>
      <p className="muted">{site.role} · {site.location}</p>
      <p>{site.bio}</p>
      <div className="chips">
        {site.skills.map(skill => <span key={skill} className="chip">{skill}</span>)}
      </div>
    </div>
  )
}

export function ProjectList({ showSamples = false }: { showSamples?: boolean }) {
  const { t } = useTranslation()
  const site = getSite(useLocale())
  const projects = site.projects.filter(project => showSamples || !project.sample)

  return (
    <div className="projects">
      {projects.map(project => (
        <article key={project.id} className="card">
          <div className="card-head">
            <h2>{project.name}</h2>
            {project.url && <a href={project.url} target="_blank" rel="noreferrer"
              aria-label={`${project.name} · ${t('desktop.view')}`}>{t('desktop.view')}</a>}
          </div>
          <p>{project.desc}</p>
          <div className="chips">
            {project.tech.map(tech => <span key={tech} className="chip">{tech}</span>)}
          </div>
        </article>
      ))}
    </div>
  )
}

export function SiteContent({ view }: { view: 'about' | 'projects' }) {
  const { t } = useTranslation()
  const site = getSite(useLocale())
  const title = t(`navigation.${view}`)
  useEffect(() => { document.title = `${title} · ${site.title}` }, [title, site.title])

  return (
    <ContentDialog title={title} pageKey={view}>
      <div className="site-content page">
        {view === 'about' ? <AboutProfile /> : <ProjectList />}
      </div>
    </ContentDialog>
  )
}
