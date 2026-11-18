import { useId, useLayoutEffect, useRef, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { navigate } from '../route'
import { LanguageSwitcher } from './LanguageSwitcher'

export function ContentDialog({ title, pageKey, wide = false, children }: {
  title: string
  pageKey: string
  wide?: boolean
  children: ReactNode
}) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useLayoutEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    dialog.showModal()
    return () => dialog.close()
  }, [])

  useLayoutEffect(() => {
    const dialog = ref.current
    const heading = dialog?.querySelector<HTMLElement>('[data-reading-heading]')
      ?? document.getElementById(titleId)
    heading?.focus({ preventScroll: true })
  }, [pageKey, titleId])

  return (
    <dialog ref={ref} data-overlay className="content-dialog" data-wide={wide} aria-labelledby={titleId}
      onClose={event => { if (!event.currentTarget.open) navigate('/') }}
      onClick={event => { if (event.target === event.currentTarget) event.currentTarget.close() }}>
      <header className="content-header">
        <h1 id={titleId} className="hand" tabIndex={-1}>{title}</h1>
        <div className="content-actions">
          <LanguageSwitcher />
          <form method="dialog">
            <button className="back" type="submit">{t('hud.back')}</button>
          </form>
        </div>
      </header>
      {children}
    </dialog>
  )
}
