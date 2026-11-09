import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
export function Modal({title,onClose,children}:{title:string;onClose():void;children:ReactNode}){
  const ref=useRef<HTMLDivElement>(null),closeRef=useRef(onClose);closeRef.current=onClose
  const {t}=useTranslation()
  useEffect(()=>{
    const previous=document.activeElement as HTMLElement|null
    ref.current?.querySelector<HTMLElement>('button,input,select,a[href]')?.focus()
    const key=(event:KeyboardEvent)=>{
      if(event.defaultPrevented)return
      if(event.key==='Escape'){event.preventDefault();event.stopPropagation();closeRef.current()}
      if(event.key==='Tab'){
        const items=[...ref.current!.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select,a[href]')]
        const first=items[0],last=items[items.length-1]
        if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus()}
        else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus()}
      }
    }
    window.addEventListener('keydown',key)
    return()=>{window.removeEventListener('keydown',key);previous?.focus()}
  },[])
  return createPortal(<div className="environment-backdrop" data-overlay onPointerDown={event=>{if(event.target===event.currentTarget)onClose()}}><div className="environment-panel" ref={ref} role="dialog" aria-modal="true" aria-label={title}><div className="environment-heading"><h2>{title}</h2><button className="paper-button" onClick={onClose} aria-label={t('environment.close')}>×</button></div>{children}</div></div>,document.body)
}
