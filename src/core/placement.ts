import { clamp, toRadians } from "./math.js"
import type { PositionedItem, SpherItemBase, SpherPlacement } from "./types.js"

export type SphericalPosition = {
  longitude: number
  latitude: number
  baseX: number
  baseY: number
  baseZ: number
}

export type PlaceItemsOptions<TItem extends SpherItemBase> = {
  radius: number
  placement?: SpherPlacement
  size?: number | ((item: TItem, index: number, items: TItem[]) => number)
  position?: (
    item: TItem,
    index: number,
    items: TItem[],
  ) => Pick<SphericalPosition, "latitude" | "longitude"> | null | undefined
}

// cobe parity: positions follow `[-cosLat·cos(lon'), sin(lat), cosLat·sin(lon')]`.
// cobe shifts longitude by -π so lon=0 sits at +X. Spher uses -π/2 so lon=0 sits at
// -Z (front of the camera at default rotation).
const longitudeOffsetRadians = -Math.PI / 2

const sphereCoordinates = (
  latitudeRadians: number,
  longitudeRadians: number,
  sphereRadius: number,
) => {
  const lon = longitudeRadians + longitudeOffsetRadians
  const cosLat = Math.cos(latitudeRadians)
  return {
    baseX: -cosLat * Math.cos(lon) * sphereRadius,
    baseY: Math.sin(latitudeRadians) * sphereRadius,
    baseZ: cosLat * Math.sin(lon) * sphereRadius,
  }
}

export const getFibonacciSpherePosition = (
  index: number,
  itemCount: number,
  sphereRadius: number,
): SphericalPosition => {
  const goldenAngle = 137.50776405003785
  const y = 1 - (2 * (index + 0.5)) / Math.max(1, itemCount)
  const longitude = ((((index * goldenAngle + 180) % 360) + 360) % 360) - 180
  const latitude = Math.asin(clamp(y, -1, 1)) * (180 / Math.PI)

  return {
    longitude,
    latitude,
    ...sphereCoordinates(toRadians(latitude), toRadians(longitude), sphereRadius),
  }
}

export const getSphericalPosition = (
  latitude: number,
  longitude: number,
  sphereRadius: number,
): SphericalPosition => ({
  longitude,
  latitude,
  ...sphereCoordinates(toRadians(latitude), toRadians(longitude), sphereRadius),
})

export const placeItems = <TItem extends SpherItemBase>(
  items: TItem[],
  { radius, placement = "fibonacci", size = 64, position }: PlaceItemsOptions<TItem>,
): PositionedItem<TItem>[] => {
  return items.map((item, index) => {
    const explicitPosition = position?.(item, index, items)
    const { longitude, latitude, baseX, baseY, baseZ } = explicitPosition
      ? getSphericalPosition(explicitPosition.latitude, explicitPosition.longitude, radius)
      : placement === "latitude-longitude-grid"
        ? getLatitudeLongitudeGridPosition(index, items.length, radius)
        : getFibonacciSpherePosition(index, items.length, radius)
    const clampedLatitude = clamp(latitude, -82, 82)
    const itemSize = typeof size === "function" ? size(item, index, items) : size

    return {
      ...item,
      longitude,
      latitude: clampedLatitude,
      baseX,
      baseY,
      baseZ,
      radius,
      roll: 0,
      size: itemSize,
    }
  })
}

export const getLatitudeLongitudeGridPosition = (
  index: number,
  itemCount: number,
  sphereRadius: number,
): SphericalPosition => {
  const ringCount = itemCount % 7 === 0 ? 7 : 9
  const rowCounts = getLatitudeLongitudeGridRowCounts(itemCount, ringCount)
  let row = 0
  let indexInRow = index
  while (row < rowCounts.length - 1 && indexInRow >= rowCounts[row]) {
    indexInRow -= rowCounts[row]
    row += 1
  }

  const columnCount = rowCounts[row]
  const latitudeStart = -66
  const latitudeEnd = 66
  const latitude =
    latitudeStart + (row / Math.max(1, ringCount - 1)) * (latitudeEnd - latitudeStart)
  const longitude = -180 + ((indexInRow + 0.5) / columnCount) * 360

  return {
    longitude,
    latitude,
    ...sphereCoordinates(toRadians(latitude), toRadians(longitude), sphereRadius),
  }
}

export const getLatitudeLongitudeGridRowCounts = (itemCount: number, ringCount: number) => {
  const rowWeights = Array.from({ length: ringCount }, (_, row) =>
    row === 0 || row === ringCount - 1 ? 0.5 : 1,
  )
  const totalWeight = rowWeights.reduce((sum, weight) => sum + weight, 0)
  const rawCounts = rowWeights.map((weight) => (itemCount * weight) / totalWeight)
  const rowCounts = rawCounts.map((count) => Math.max(1, Math.floor(count)))
  let assignedCount = rowCounts.reduce((sum, count) => sum + count, 0)

  while (assignedCount < itemCount) {
    let targetRow = 0
    let largestRemainder = -Infinity
    for (let row = 0; row < ringCount; row += 1) {
      const remainder = rawCounts[row] - rowCounts[row]
      if (remainder > largestRemainder) {
        largestRemainder = remainder
        targetRow = row
      }
    }
    rowCounts[targetRow] += 1
    assignedCount += 1
  }

  return rowCounts
}
