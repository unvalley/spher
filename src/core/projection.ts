import { clamp, toRadians } from "./math.js"
import type { PositionedItem, ProjectedItem } from "./types.js"

type ProjectItemsOptions = {
  rotation: {
    x: number
    y: number
  }
  tilt?: {
    x: number
    y: number
    z: number
  }
  zoom?: number
  perspective: number
  perspectiveMode?: "inside" | "outside"
}

export const projectItems = <TItem>(
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
