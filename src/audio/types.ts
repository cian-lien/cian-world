export interface AudioPreferences { muted: boolean; ambienceEnabled: boolean; effectsEnabled: boolean; ambienceVolume: number; effectsVolume: number }
export interface MixLayer { id: string; gain: number }
export interface MixTarget { layers: MixLayer[]; cutoff: number; outsideGain: number; thunder: boolean }
export interface AudioClip { id: string; file: string; role: string; duration: number; loopStart: number; loopEnd: number; defaultGain: number; sourceId: string; bytes: number }
