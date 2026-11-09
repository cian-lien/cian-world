import { useTranslation } from 'react-i18next'
import { useAudioPreferences,setAudioPreferences } from '../audio/preferences'
import { unlockAudio } from '../audio/browser'
export function SoundButton() {
  const audio = useAudioPreferences()
  const { t } = useTranslation()
  const off = audio.muted || !audio.ambienceEnabled

  function toggle() {
    if (off) {
      setAudioPreferences({ muted: false, ambienceEnabled: true })
      void unlockAudio()
    } else {
      setAudioPreferences({ muted: true })
    }
  }

  return <button className="paper-button sound-button" aria-label={t(off ? 'environment.unmute' : 'environment.mute')}
    aria-pressed={off} onClick={toggle}>{off ? '🔇' : '🔊'}</button>
}
