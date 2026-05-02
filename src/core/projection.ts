import { clamp, toRadians } from "./math.js"
import type { PositionedItem, ProjectedItem, SpherItemBase } from "./types.js"

export type SpherRotation = {
  x: number
  y: number
}

export type SpherTilt = {
  x: number
  y: number
  z: number
}

export type ProjectItemsOptions = {
  rotation: SpherRotation
  tilt?: SpherTilt
  zoom?: number
  perspective: number
  perspectiveMode?: "inside" | "outside"
}

export const projectItems = <TItem extends SpherItemBase>(
  items: PositionedItem<TItem>[],
  { rotation, tilt, zoom = 1, perspective, perspectiveMode = "outside" }: ProjectItemsOptions,
): ProjectedItem<TItem>[] => {
  // cobe parity: apply RotX(theta) · RotY(phi) · p, where phi = yaw (rotation.y)
  // and theta = pitch (rotation.x). Same matrix form as cobe's marker/arc shaders.
  const theta = toRadians(rotation.x + (tilt?.x ?? 0))
  const phi = toRadians(rotation.y + (tilt?.y ?? 0))
  const roll = toRadians(tilt?.z ?? 0)
  const cx = Math.cos(theta)
  const cy = Math.cos(phi)
  const sx = Math.sin(theta)
  const sy = Math.sin(phi)
  const cz = Math.cos(roll)
  const sz = Math.sin(roll)

  return items.map((item) => {
    let x = cy * item.baseX + sy * item.baseZ
    let y = sy * sx * item.baseX + cx * item.baseY - cy * sx * item.baseZ
    let z = -sy * cx * item.baseX + sx * item.baseY + cy * cx * item.baseZ

    if (roll !== 0) {
      const rolledX = cz * x - sz * y
      y = sz * x + cz * y
      x = rolledX
    }

    const normalY = clamp(y / item.radius, -1, 1)

    x *= zoom
    y *= zoom
    z *= zoom

    const perspectiveScale = getPerspectiveScale(z, perspective, perspectiveMode)
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

const getPerspectiveScale = (
  z: number,
  perspective: number,
  perspectiveMode: ProjectItemsOptions["perspectiveMode"],
) => perspective / Math.max(1, perspective + (perspectiveMode === "inside" ? -z : z))

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

export type SelectVisibleSurfaceItemIdsOptions<TItem extends SpherItemBase> = {
  projectedItems: ProjectedItem<TItem>[]
  radius: number
  zoom?: number
  sceneScale?: number
  prioritizeIds?: Set<string>
}

export const selectVisibleSurfaceItemIds = <TItem extends SpherItemBase>({
  projectedItems,
  radius,
  zoom = 1,
  sceneScale = 1,
  prioritizeIds = new Set(),
}: SelectVisibleSurfaceItemIdsOptions<TItem>) =>
  selectInsideVisibleItemIds(
    projectedItems,
    Math.max(0, zoom - 1),
    sceneScale,
    radius,
    true,
    prioritizeIds,
  )

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
