import {useTranslation} from 'react-i18next'
import {worldActions,actionIcons,requestWorldAction} from '../world/actions'
export default function RooftopMenu(){const{t}=useTranslation();return <details className="rooftop-menu"><summary>{t('rooftop.explore')}</summary><nav aria-label={t('rooftop.explore')}>{worldActions.map(action=><button className="paper-button" key={action} onClick={event=>{requestWorldAction(action);const details=event.currentTarget.closest('details');if(details)details.open=false}}>{actionIcons[action]} {t(`rooftop.actions.${action}`)}</button>)}</nav></details>}
