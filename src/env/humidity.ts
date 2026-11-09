/** Model history, not a forecast guess: absent observations never create damp weather. */
export function isHuinantian(weather:{humidity?:number|null;temperature:number|null;previousDayTemperature?:number|null},termIndex:number):boolean {
 const {humidity,temperature,previousDayTemperature}=weather
 return termIndex>=0&&termIndex<=4&&humidity!=null&&temperature!=null&&previousDayTemperature!=null&&[humidity,temperature,previousDayTemperature].every(Number.isFinite)&&humidity>=90&&temperature>previousDayTemperature
}
