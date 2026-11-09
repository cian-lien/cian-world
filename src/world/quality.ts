export interface QualityState {level:number;lowSince:number;highSince:number;changedAt:number}
export function updateQuality(state:QualityState,fps:number,now:number):QualityState {
  const next={...state}
  if(fps<40){next.highSince=0;next.lowSince ||= now;if(now-next.lowSince>=10000&&now-next.changedAt>=10000&&next.level>0){next.level--;next.changedAt=now;next.lowSince=now}}
  else if(fps>=55){next.lowSince=0;next.highSince ||= now;if(now-next.highSince>=30000&&now-next.changedAt>=10000&&next.level<2){next.level++;next.changedAt=now;next.highSince=now}}
  else{next.lowSince=0;next.highSince=0}
  return next
}
