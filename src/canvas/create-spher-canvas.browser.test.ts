import { afterEach, describe, expect, it } from "vitest"
import { createSpher as createRootSpher } from "../create-spher.js"
import { createSpher } from "./create-spher-canvas.js"
import { createCardRenderer, createCardSpher } from "./renderers.js"

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

describe("createSpher", () => {
  it("renders items into a high-DPI canvas", () => {
    const canvas = createCanvas()
    const instance = createSpher(canvas, {
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

  it("renders card covers with the root preset", () => {
    const canvas = createCanvas()
    const instance = createRootSpher(canvas, {
      card: {
        colors: { archive: ["#dbeafe", "#60a5fa"] },
        cover: () => undefined,
        tone: () => "archive",
      },
      devicePixelRatio: 1,
      items: [{ id: "card" }],
      position: () => ({ latitude: 0, longitude: 0 }),
      radius: 100,
      size: 60,
    })
    const context = canvas.getContext("2d")

    expect(context?.getImageData(200, 200, 1, 1).data[3]).toBeGreaterThan(0)

    instance.destroy()
  })

  it("renders custom card content with the generic preset renderer", () => {
    const canvas = createCanvas()
    const renderer = createCardRenderer({
      render: (context, item, _state, frame) => {
        context.fillStyle = item.id === "metric" ? "#111827" : "#ffffff"
        context.fillRect(frame.coverX, frame.coverY, frame.coverWidth, frame.coverHeight)
      },
    })
    const instance = createSpher(canvas, {
      devicePixelRatio: 1,
      items: [{ id: "metric" }],
      position: () => ({ latitude: 0, longitude: 0 }),
      radius: 100,
      render: renderer,
      size: 60,
    })
    const context = canvas.getContext("2d")

    expect(context?.getImageData(200, 200, 1, 1).data[3]).toBeGreaterThan(0)

    instance.destroy()
  })

  it("creates a generic card sphere preset", () => {
    const canvas = createCanvas()
    const instance = createCardSpher(canvas, {
      devicePixelRatio: 1,
      items: [{ id: "label" }],
      position: () => ({ latitude: 0, longitude: 0 }),
      radius: 100,
      render: (context, _item, _state, frame) => {
        context.fillStyle = "#111827"
        context.fillRect(frame.coverX, frame.coverY, frame.coverWidth, frame.coverHeight)
      },
      size: 60,
    })
    const context = canvas.getContext("2d")

    expect(context?.getImageData(200, 200, 1, 1).data[3]).toBeGreaterThan(0)

    instance.destroy()
  })

  it("selects a front item from pointer interaction", () => {
    const canvas = createCanvas()
    const selectedIds: string[] = []
    const instance = createSpher(canvas, {
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
    const instance = createSpher(canvas, {
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
    const instance = createSpher(canvas, {
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
    const instance = createSpher(canvas, {
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
    const instance = createSpher(canvas, {
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

  it("keeps tilt separate from interactive rotation", () => {
    const canvas = createCanvas()
    const instance = createSpher(canvas, {
      items: [{ id: "front" }],
      position: () => ({ latitude: 0, longitude: 0 }),
      radius: 100,
      tilt: { x: 12, z: -8 },
    })

    expect(instance.getState().rotation).toEqual({ x: 0, y: 0 })
    expect(instance.getState().tilt).toEqual({ x: 12, y: 0, z: -8 })
    expect(instance.itemState("front")?.item.id).toBe("front")

    instance.update({ rotation: { x: 4, y: 24 }, tilt: -6 })

    expect(instance.getState().rotation).toEqual({ x: 4, y: 24 })
    expect(instance.getState().tilt).toEqual({ x: -6, y: 0, z: 0 })

    instance.update({ tilt: { z: 4 } })

    expect(instance.getState().tilt).toEqual({ x: -6, y: 0, z: 4 })

    instance.destroy()
  })

  it("resolves responsive card sizes with ratio bounds", () => {
    const canvas = createCanvas()
    const instance = createSpher(canvas, {
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
    const instance = createSpher(canvas, {
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
    const instance = createSpher(canvas, {
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

  it("reports whether the configured card cover side is visible", () => {
    const canvas = createCanvas()
    const instance = createSpher(canvas, {
      items: [{ id: "near" }, { id: "far" }],
      position: (item) =>
        item.id === "near" ? { latitude: 0, longitude: 0 } : { latitude: 0, longitude: 180 },
      radius: 100,
    })

    expect(instance.itemState("near")?.visibleSide).toBe("outside")
    expect(instance.itemState("near")?.coverVisible).toBe(true)
    expect(instance.itemState("far")?.visibleSide).toBe("inside")
    expect(instance.itemState("far")?.coverVisible).toBe(false)

    instance.update({ faceMode: "face-in" })

    expect(instance.itemState("near")?.coverVisible).toBe(false)
    expect(instance.itemState("far")?.coverVisible).toBe(true)

    instance.destroy()
  })

  it("keeps visibility continuous around the sphere edge", () => {
    const canvas = createCanvas()
    const instance = createSpher(canvas, {
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
    const instance = createSpher(canvas, {
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
    const instance = createSpher(canvas, {
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
    const instance = createSpher(canvas, {
      items: [{ id: "near" }, { id: "far" }],
      position: (item) =>
        item.id === "near" ? { latitude: 0, longitude: 180 } : { latitude: 0, longitude: 0 },
      radius: 100,
      render: (_context, item) => {
        renderedIds.push(item.id)
      },
      zoom: { value: 2 },
    })

    expect(instance.getState().viewMode).toBe("inside")
    expect(instance.itemState("near")?.visibility).toBe(0)
    expect(instance.itemState("far")?.visibility).toBeGreaterThan(0)
    expect(renderedIds).not.toContain("near")
    expect(renderedIds).toContain("far")

    instance.destroy()
  })

  it("keeps inside-view item transforms bounded after zooming into the sphere", () => {
    const canvas = createCanvas()
    const transforms: DOMMatrix[] = []
    const instance = createSpher(canvas, {
      devicePixelRatio: 1,
      items: [{ id: "inside" }],
      position: () => ({ latitude: 0, longitude: 0 }),
      radius: 180,
      render: (context) => {
        transforms.push(context.getTransform())
        context.fillRect(-10, -10, 20, 20)
      },
      size: 40,
      zoom: { value: 4.4 },
    })

    expect(instance.getState().viewMode).toBe("inside")
    expect(Math.abs(transforms[0].a)).toBeLessThan(2)
    expect(Math.abs(transforms[0].d)).toBeLessThan(2)

    instance.destroy()
  })
})

const waitFrames = async (count: number) => {
  for (let index = 0; index < count; index += 1) {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }
}
