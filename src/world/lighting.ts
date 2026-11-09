const clamp=(value:number)=>Math.max(0,Math.min(1,value))
/** Lighting reaches zero at the horizon, so changing the light direction cannot flash. */
export function skyLighting(altitude:number){return {ambient:.6+1.1*clamp((altitude+6)/18),sun:clamp(altitude/12),moon:clamp(-altitude/6)}}
