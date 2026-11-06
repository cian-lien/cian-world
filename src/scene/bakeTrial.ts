const params = new URLSearchParams(window.location.search)
const bake = params.get('bake')

export const bakeTrial = bake === 'trial'
export const hybridRoom = !bakeTrial && bake !== 'live'
export const hybridProduction = hybridRoom && bake !== 'hybrid'
export const hybridRoomUrl = `${import.meta.env.BASE_URL}${hybridProduction ? 'bake-room' : 'bake-hybrid'}/`
export const bakeReference = (bakeTrial || hybridRoom) && params.get('cam') === 'reference'
export const bakeTrialUrl = `${import.meta.env.BASE_URL}bake-trial/`
