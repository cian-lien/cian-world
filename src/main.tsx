import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import './i18n'
import App from './App'
import './styles.css'

const ref = import.meta.env.DEV ? new URLSearchParams(location.search).get('ref') : null
const ReferenceView = ref === 'day' || ref === 'night' ? lazy(() => import('./ui/ReferenceView')) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {ReferenceView && (ref === 'day' || ref === 'night')
      ? <Suspense fallback={null}><ReferenceView variant={ref} /></Suspense>
      : <App />}
  </StrictMode>,
)
