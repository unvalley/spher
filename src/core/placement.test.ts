import { describe, expect, it } from "vitest"
import { findNearestProjectedItem } from "./hit-test.js"
import { placeItems } from "./placement.js"
import { projectItems } from "./projection.js"

describe("core sphere projection", () => {
  it("places arbitrary id-only items without archive fields", () => {
    const placed = placeItems([{ id: "a" }, { id: "b" }], { radius: 100 })

    expect(placed).toHaveLength(2)
    expect(placed[0]).toMatchObject({
      id: "a",
      radius: 100,
      size: 64,
    })
    expect(Number.isFinite(placed[0].baseX)).toBe(true)
    expect(Number.isFinite(placed[0].baseY)).toBe(true)
    expect(Number.isFinite(placed[0].baseZ)).toBe(true)
  })

  it("projects an explicit front-facing location to the center", () => {
    const placed = placeItems([{ id: "front", position: { latitude: 0, longitude: 0 } }], {
      radius: 100,
      position: (item) => item.position,
    })
    const [projected] = projectItems(placed, {
      rotation: { x: 0, y: 0 },
      perspective: 500,
    })

    expect(projected.item.id).toBe("front")
    expect(projected.projectedX).toBeCloseTo(0)
    expect(projected.projectedY).toBeCloseTo(0)
    expect(projected.z).toBeLessThan(0)
  })

  it("finds the nearest projected item inside the hit radius", () => {
    const placed = placeItems(
      [
        { id: "front", position: { latitude: 0, longitude: 0 }, size: 40 },
        { id: "side", position: { latitude: 0, longitude: 45 }, size: 40 },
      ],
      {
        radius: 100,
        size: (item) => item.size,
        position: (item) => item.position,
      },
    )
    const projected = projectItems(placed, {
      rotation: { x: 0, y: 0 },
      perspective: 500,
    })

    const nearest = findNearestProjectedItem(200, 200, projected, {
      left: 0,
      top: 0,
      width: 400,
      height: 400,
    })

    expect(nearest?.id).toBe("front")
  })
})
