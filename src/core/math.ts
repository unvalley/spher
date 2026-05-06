export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

export const toRadians = (degrees: number) => (degrees * Math.PI) / 180
