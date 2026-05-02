import { afterEach, describe, expect, it } from "vitest"
import { createSpherCanvas } from "./create-spher-canvas.js"

const canvases: HTMLCanvasElement[] = []

const createCanvas = () => {
  const canvas = document.createElement("canvas")
  Object.assign(canvas.style, {
    width: "400px",
    height: "400px",
  })
  document.body.append(canvas)
  canvases.push(canvas)
  return canvas
}

afterEach(() => {
  for (const canvas of canvases) canvas.remove()
  canvases.length = 0
})

describe("createSpherCanvas", () => {
  it("renders items into a high-DPI canvas", () => {
    const canvas = createCanvas()
    const instance = createSpherCanvas(canvas, {
      devicePixelRatio: 2,
      items: [{ id: "front" }],
      position: () => ({ latitude: 0, longitude: 0 }),
      radius: 100,
      render: (context, _item, state) => {
        context.fillStyle = state.selected ? "#111827" : "#ffffff"
        context.fillRect(-10, -10, 20, 20)
      },
      selectedId: "front",
    })

    expect(canvas.width).toBe(800)
    expect(canvas.height).toBe(800)
    expect(instance.itemState("front")?.front).toBe(true)
    expect(instance.itemState("front")?.selected).toBe(true)

    instance.destroy()
  })

  it("selects a front item from pointer interaction", () => {
    const canvas = createCanvas()
    const selectedIds: string[] = []
    const instance = createSpherCanvas(canvas, {
      controls: { drag: true },
      items: [{ id: "selectable" }],
      onSelect: (item) => selectedIds.push(item.id),
      position: () => ({ latitude: 0, longitude: 0 }),
      radius: 100,
      size: 60,
    })

    canvas.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        clientX: 200,
        clientY: 200,
        pointerId: 1,
      }),
    )
    canvas.dispatchEvent(
      new PointerEvent("pointerup", {
        bubbles: true,
        clientX: 200,
        clientY: 200,
        pointerId: 1,
      }),
    )

    expect(selectedIds).toEqual(["selectable"])
    expect(instance.getState().selectedId).toBe("selectable")

    instance.destroy()
  })

  it("eases keyboard rotation toward the target rotation", async () => {
    const canvas = createCanvas()
    const instance = createSpherCanvas(canvas, {
      controls: { keyboard: true },
      items: [{ id: "front" }],
      position: () => ({ latitude: 0, longitude: 0 }),
      radius: 100,
    })

    window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }))

    expect(instance.getState().rotation.y).toBe(0)
    await waitFrames(24)
    expect(instance.getState().rotation.y).toBeCloseTo(1, 1)

    instance.destroy()
  })

  it("applies cobe-style drag rotation from the pointer origin", () => {
    const canvas = createCanvas()
    const instance = createSpherCanvas(canvas, {
      controls: { drag: true },
      items: [{ id: "front" }],
      position: () => ({ latitude: 0, longitude: 0 }),
      radius: 100,
    })

    canvas.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        clientX: 200,
        clientY: 200,
        pointerId: 1,
      }),
    )
    canvas.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: 250,
        clientY: 175,
        pointerId: 1,
      }),
    )
    canvas.dispatchEvent(
      new PointerEvent("pointerup", {
        bubbles: true,
        clientX: 250,
        clientY: 175,
        pointerId: 1,
      }),
    )

    expect(instance.getState().rotation.x).toBeCloseTo(1.43, 1)
    expect(instance.getState().rotation.y).toBeCloseTo(9.55, 1)

    instance.destroy()
  })

  it("auto rotates when enabled", async () => {
    const canvas = createCanvas()
    const instance = createSpherCanvas(canvas, {
      controls: { autoRotate: { speed: 1 } },
      items: [{ id: "front" }],
      position: () => ({ latitude: 0, longitude: 0 }),
      radius: 100,
    })

    await waitFrames(3)
    expect(instance.getState().rotation.y).toBeGreaterThan(0)

    instance.destroy()
  })

  it("draws item renderers on the projected sphere tangent plane", () => {
    const canvas = createCanvas()
    const transforms: DOMMatrix[] = []
    const instance = createSpherCanvas(canvas, {
      devicePixelRatio: 1,
      items: [{ id: "edge" }],
      position: () => ({ latitude: 0, longitude: 65 }),
      radius: 120,
      render: (context) => {
        transforms.push(context.getTransform())
        context.fillRect(-10, -10, 20, 20)
      },
      size: 40,
    })

    expect(transforms).toHaveLength(1)
    expect(Math.abs(transforms[0].a)).toBeLessThan(Math.abs(transforms[0].d) * 0.7)

    instance.destroy()
  })

  it("resolves responsive card sizes with ratio bounds", () => {
    const canvas = createCanvas()
    const instance = createSpherCanvas(canvas, {
      items: [{ id: "bounded" }],
      position: () => ({ latitude: 0, longitude: 0 }),
      radius: "auto",
      size: { max: 72, min: 48, ratio: 0.5 },
    })

    expect(instance.itemState("bounded")?.item.size).toBe(72)

    instance.destroy()
  })

  it("scales ratio card sizes from the sphere diameter", () => {
    const canvas = createCanvas()
    const instance = createSpherCanvas(canvas, {
      items: [{ id: "responsive" }],
      position: () => ({ latitude: 0, longitude: 0 }),
      radius: 100,
      size: { ratio: 0.1 },
    })

    expect(instance.itemState("responsive")?.item.size).toBe(20)

    instance.update({ radius: 160 })

    expect(instance.itemState("responsive")?.item.size).toBe(32)

    instance.destroy()
  })

  it("draws farther items before nearer items", () => {
    const canvas = createCanvas()
    const renderedIds: string[] = []
    const instance = createSpherCanvas(canvas, {
      items: [{ id: "near" }, { id: "far" }],
      position: (item) =>
        item.id === "near" ? { latitude: 0, longitude: 0 } : { latitude: 0, longitude: 180 },
      radius: 100,
      render: (_context, item) => {
        renderedIds.push(item.id)
      },
    })

    expect(renderedIds).toEqual(["far", "near"])

    instance.destroy()
  })

  it("reports whether the configured card image side is visible", () => {
    const canvas = createCanvas()
    const instance = createSpherCanvas(canvas, {
      items: [{ id: "near" }, { id: "far" }],
      position: (item) =>
        item.id === "near" ? { latitude: 0, longitude: 0 } : { latitude: 0, longitude: 180 },
      radius: 100,
    })

    expect(instance.itemState("near")?.visibleSide).toBe("outside")
    expect(instance.itemState("near")?.imageVisible).toBe(true)
    expect(instance.itemState("far")?.visibleSide).toBe("inside")
    expect(instance.itemState("far")?.imageVisible).toBe(false)

    instance.update({ faceMode: "face-in" })

    expect(instance.itemState("near")?.imageVisible).toBe(false)
    expect(instance.itemState("far")?.imageVisible).toBe(true)

    instance.destroy()
  })

  it("keeps visibility continuous around the sphere edge", () => {
    const canvas = createCanvas()
    const instance = createSpherCanvas(canvas, {
      items: [{ id: "edge-a" }, { id: "edge-b" }],
      position: (item) =>
        item.id === "edge-a" ? { latitude: 0, longitude: 72 } : { latitude: 0, longitude: 73 },
      radius: 100,
    })

    const firstVisibility = instance.itemState("edge-a")?.visibility ?? 0
    const secondVisibility = instance.itemState("edge-b")?.visibility ?? 0
    expect(Math.abs(firstVisibility - secondVisibility)).toBeLessThan(0.04)

    instance.destroy()
  })

  it("fades edge-on cards fully out to avoid side flicker", () => {
    const canvas = createCanvas()
    const instance = createSpherCanvas(canvas, {
      items: [{ id: "edge" }],
      position: () => ({ latitude: 0, longitude: 90 }),
      radius: 100,
    })

    expect(instance.itemState("edge")?.visibility).toBeLessThan(0.01)

    instance.update({ faceMode: "face-in" })

    expect(instance.itemState("edge")?.visibility).toBeLessThan(0.01)

    instance.destroy()
  })

  it("keeps rear cards visible while fading only side-on cards", () => {
    const canvas = createCanvas()
    const instance = createSpherCanvas(canvas, {
      items: [{ id: "front" }, { id: "side" }, { id: "rear" }],
      position: (item) => {
        if (item.id === "front") return { latitude: 0, longitude: 0 }
        if (item.id === "side") return { latitude: 0, longitude: 90 }
        return { latitude: 0, longitude: 180 }
      },
      radius: 100,
    })

    expect(instance.itemState("side")?.visibility).toBeLessThan(0.01)
    expect(instance.itemState("rear")?.visibility).toBeGreaterThan(0.1)

    instance.update({ faceMode: "face-in" })

    expect(instance.itemState("side")?.visibility).toBeLessThan(0.01)
    expect(instance.itemState("rear")?.visibility).toBeGreaterThan(0.5)

    instance.destroy()
  })

  it("hides near-side items after zooming inside the sphere", () => {
    const canvas = createCanvas()
    const renderedIds: string[] = []
    const instance = createSpherCanvas(canvas, {
      items: [{ id: "near" }, { id: "far" }],
      position: (item) =>
        item.id === "near" ? { latitude: 0, longitude: 180 } : { latitude: 0, longitude: 0 },
      radius: 100,
      render: (_context, item) => {
        renderedIds.push(item.id)
      },
      zoom: 2,
    })

    expect(instance.getState().viewMode).toBe("inside")
    expect(instance.itemState("near")?.visibility).toBe(0)
    expect(instance.itemState("far")?.visibility).toBeGreaterThan(0)
    expect(renderedIds).not.toContain("near")
    expect(renderedIds).toContain("far")

    instance.destroy()
  })
})

const waitFrames = async (count: number) => {
  for (let index = 0; index < count; index += 1) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
}
