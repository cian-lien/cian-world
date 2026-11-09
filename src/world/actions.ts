export type WorldAction='door'|'telescope'|'garden'|'tea'|'book'|'radio'|'laundry'|'cat'
export const worldActions:WorldAction[]=['door','telescope','garden','tea','book','radio','laundry','cat']
export const actionIcons:Record<WorldAction,string>={door:'🚪',telescope:'🔭',garden:'🌱',tea:'🍵',book:'📖',radio:'📻',laundry:'👕',cat:'🐱'}
export function requestWorldAction(action:WorldAction){window.dispatchEvent(new CustomEvent('rooftop:action',{detail:action}))}
