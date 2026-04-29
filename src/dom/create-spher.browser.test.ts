import { afterEach, describe, expect, it } from "vitest"
import { createSpher } from "./create-spher.js"

const roots: HTMLElement[] = []

const createRoot = () => {
  const root = document.createElement("div")
  Object.assign(root.style, {
    width: "400px",
    height: "400px",
  })
  document.body.append(root)
  roots.push(root)
  return root
}

afterEach(() => {
  for (const root of roots) root.remove()
  roots.length = 0
})

describe("createSpher", () => {
  it("renders items as DOM slots with surface CSS variables", () => {
    const root = createRoot()
    const instance = createSpher(root, {
      radius: 100,
      perspective: 500,
      items: [
        {
          id: "front",
        },
      ],
      position: () => ({ latitude: 0, longitude: 0 }),
      size: 40,
      render: (item, element) => {
        element.textContent = item.id
      },
    })

    const element = root.querySelector<HTMLElement>('[data-spher-item="front"]')

    expect(element).not.toBeNull()
    expect(element?.textContent).toBe("front")
    expect(element?.style.getPropertyValue("--spher-longitude")).toBe("0deg")
    expect(element?.style.getPropertyValue("--spher-latitude")).toBe("0deg")
    expect(element?.dataset.spherVisible).toBe("true")
    expect(instance.itemState("front")?.front).toBe(true)

    instance.destroy()
  })

  it("updates surface state without recreating existing elements", () => {
    const root = createRoot()
    const instance = createSpher(root, {
      radius: 100,
      perspective: 500,
      items: [{ id: "item" }],
      position: () => ({ latitude: 0, longitude: 0 }),
      render: (item, element) => {
        element.textContent = item.id
      },
    })
    const element = root.querySelector<HTMLElement>('[data-spher-item="item"]')

    instance.rotateTo({ x: 0, y: 180 })

    expect(root.querySelector<HTMLElement>('[data-spher-item="item"]')).toBe(element)
    expect(instance.itemState("item")?.front).toBe(false)
    expect(instance.itemState("item")?.visible).toBe(false)
    expect(element?.dataset.spherVisible).toBe("true")
    expect(element?.dataset.spherFront).toBe("false")
    expect(element?.style.opacity).toBe("0.033676")

    instance.destroy()
  })

  it("reduces overlapping visible surface items", () => {
    const root = createRoot()
    const instance = createSpher(root, {
      radius: 100,
      perspective: 500,
      zoom: 2,
      items: [{ id: "first" }, { id: "second" }],
      position: () => ({ latitude: 0, longitude: 0 }),
      size: 64,
    })

    const first = instance.itemState("first")
    const second = instance.itemState("second")

    expect(first?.front).toBe(true)
    expect(second?.front).toBe(true)
    expect([first?.visible, second?.visible].filter(Boolean)).toHaveLength(1)

    instance.destroy()
  })

  it("preserves internal rotation when unrelated options update", () => {
    const root = createRoot()
    const instance = createSpher(root, {
      radius: 100,
      items: [{ id: "item" }],
    })

    instance.rotateTo({ x: 5, y: 12 })
    instance.update({ items: [{ id: "item" }], radius: 120 })

    expect(instance.getState().rotation).toEqual({ x: 5, y: 12 })

    instance.destroy()
  })

  it("preserves non-static positioning from stylesheets", () => {
    const style = document.createElement("style")
    style.textContent = ".fixed-sphere-root { position: fixed; inset: 0; }"
    document.head.append(style)

    const root = createRoot()
    root.className = "fixed-sphere-root"
    const instance = createSpher(root, {
      items: [{ id: "item" }],
    })

    expect(root.style.position).toBe("")
    expect(getComputedStyle(root).position).toBe("fixed")

    instance.destroy()
    style.remove()
  })

  it("renders items as CSS 3D sphere surfaces", () => {
    const root = createRoot()
    const instance = createSpher(root, {
      items: [{ id: "surface" }],
      position: () => ({ latitude: 12, longitude: 34 }),
      radius: 120,
      rotation: { x: 4, y: 8 },
    })

    const layer = root.querySelector<HTMLElement>("[data-spher-layer]")
    const element = root.querySelector<HTMLElement>('[data-spher-item="surface"]')

    expect(layer?.style.transform).toContain("rotateX(4deg)")
    expect(layer?.style.transform).toContain("rotateY(8deg)")
    expect(element?.style.getPropertyValue("--spher-longitude")).toBe("34deg")
    expect(element?.style.getPropertyValue("--spher-latitude")).toBe("12deg")
    expect(element?.style.transform).toContain("translateZ(-120px)")

    instance.destroy()
  })

  it("selects visible items through the DOM slot", () => {
    const root = createRoot()
    const selectedIds: string[] = []
    const instance = createSpher(root, {
      radius: 100,
      perspective: 500,
      items: [{ id: "selectable" }],
      position: () => ({ latitude: 0, longitude: 0 }),
      onSelect: (item) => selectedIds.push(item.id),
      render: (item, element) => {
        element.textContent = item.id
      },
    })

    const element = root.querySelector<HTMLElement>('[data-spher-item="selectable"]')
    element?.dispatchEvent(new MouseEvent("click", { bubbles: true }))

    expect(selectedIds).toEqual(["selectable"])
    expect(instance.getState().selectedId).toBe("selectable")
    expect(element?.dataset.spherSelected).toBe("true")

    instance.destroy()
  })

  it("cleans up generated DOM on destroy", () => {
    const root = createRoot()
    const instance = createSpher(root, {
      items: [{ id: "temporary" }],
    })

    expect(root.querySelector('[data-spher-item="temporary"]')).not.toBeNull()

    instance.destroy()

    expect(root.querySelector("[data-spher-layer]")).toBeNull()
    expect(root.querySelector('[data-spher-item="temporary"]')).toBeNull()
    expect(root.dataset.spherRoot).toBeUndefined()
  })
})
