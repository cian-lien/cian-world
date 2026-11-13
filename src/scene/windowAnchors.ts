// GLB Y-up anchors verified against bake-room, bake-hybrid, bake-trial and live exports.
export const roomWindow = { center: [1.55,1.75,-2.285] as [number,number,number], size: [.94,1.30] as [number,number] }

// The rear wall has a rectangular opening through its full thickness.
export const windowOpening = { left: 1.05, right: 2.05, bottom: 1.05, top: 2.45, inside: -2.2, outside: -2.4 }
// Exported glazing is centered at Z = -2.30 and is 12 mm thick.
export const windowGlass = { inside: -2.294, outside: -2.306, ior: 1.52 }
