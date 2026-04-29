export const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value))

export const toRadians = (degrees: number) => (degrees * Math.PI) / 180

export const cssNumber = (value: number) => {
  const rounded = Math.round(value * 1_000_000) / 1_000_000
  return Object.is(rounded, -0) ? "0" : String(rounded)
}
