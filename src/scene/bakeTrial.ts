const params = new URLSearchParams(window.location.search)

export const bakeTrial = params.get('bake') === 'trial'
export const hybridTrial = params.get('bake') === 'hybrid'
export const hybridTrialUrl = `${import.meta.env.BASE_URL}bake-hybrid/`
export const bakeReference = (bakeTrial || hybridTrial) && params.get('cam') === 'reference'
export const bakeTrialUrl = `${import.meta.env.BASE_URL}bake-trial/`
