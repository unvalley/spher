import { clamp, toRadians } from "./math.js"
import type { PositionedItem, ProjectedItem, SpherItemBase } from "./types.js"

export type SpherRotation = {
  x: number
  y: number
}

export const projectItems = <TItem extends SpherItemBase>(
  items: PositionedItem<TItem>[],
  rotation: SpherRotation,
  zoom: number,
  scenePerspective: number,
): ProjectedItem<TItem>[] => {
  return items.map((item) => {
    const rotationX = toRadians(rotation.x)
    const rotationY = toRadians(rotation.y)
    let x = item.baseX
    let y = item.baseY
    let z = item.baseZ

    const xAfterY = x * Math.cos(rotationY) + z * Math.sin(rotationY)
    const zAfterY = -x * Math.sin(rotationY) + z * Math.cos(rotationY)
    x = xAfterY
    z = zAfterY

    const yAfterX = y * Math.cos(rotationX) - z * Math.sin(rotationX)
    const zAfterX = y * Math.sin(rotationX) + z * Math.cos(rotationX)
    y = yAfterX
    z = zAfterX

    const normalY = clamp(y / item.radius, -1, 1)

    x *= zoom
    y *= zoom
    z *= zoom

    const perspectiveScale = scenePerspective / (scenePerspective - z)
    const angularDistance = Math.atan2(Math.hypot(x, y), Math.max(1, -z))
    const edgeFactor = clamp(angularDistance / (Math.PI / 2), 0, 1)

    return {
      item,
      projectedX: x * perspectiveScale,
      projectedY: y * perspectiveScale,
      perspectiveScale,
      edgeFactor,
      normalY,
      z,
    }
  })
}

export const selectInsideVisibleItemIds = <TItem extends SpherItemBase>(
  projectedItems: ProjectedItem<TItem>[],
  insideZoomProgress: number,
  insideSceneScale: number,
  sphereRadius: number,
  filterActive: boolean,
  matchingItemIds: Set<string>,
) => {
  const visibleDepth = -sphereRadius * insideSceneScale * 0.02
  const selected: ProjectedItem<TItem>[] = []
  const selectedIds = new Set<string>()
  const candidates = projectedItems
    .filter(({ z }) => z < visibleDepth)
    .sort((a, b) => {
      if (filterActive) {
        const matchDelta =
          Number(matchingItemIds.has(b.item.id)) - Number(matchingItemIds.has(a.item.id))
        if (matchDelta !== 0) return matchDelta
      }
      return a.edgeFactor - b.edgeFactor
    })

  for (const candidate of candidates) {
    const candidateRadius = getInsideCollisionRadius(
      candidate,
      insideZoomProgress,
      insideSceneScale,
    )
    const overlaps = selected.some((existing) => {
      const minimumDistance =
        candidateRadius + getInsideCollisionRadius(existing, insideZoomProgress, insideSceneScale)
      return (
        Math.hypot(
          candidate.projectedX - existing.projectedX,
          candidate.projectedY - existing.projectedY,
        ) < minimumDistance
      )
    })

    if (!overlaps) {
      selected.push(candidate)
      selectedIds.add(candidate.item.id)
    }
  }

  return selectedIds
}

const getInsideCollisionRadius = <TItem extends SpherItemBase>(
  projectedItem: ProjectedItem<TItem>,
  insideZoomProgress: number,
  insideSceneScale: number,
) => {
  const insideScale = clamp(
    (1.02 + insideZoomProgress * 0.08) * (1 - projectedItem.edgeFactor * 0.08),
    0.84,
    1.12,
  )
  return Math.max(36, projectedItem.item.size * insideScale * insideSceneScale * 0.48)
}
