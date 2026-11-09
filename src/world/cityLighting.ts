/** Continuous daily occupancy curve. Window UV seeds spread dimming across individual homes. */
export function windowCutoff(hour:number){const h=((hour%24)+24)%24;return h<6?.45-.32*Math.min(1,h/3):h>=18?.13+.32*Math.min(1,(h-18)/2):.13}
