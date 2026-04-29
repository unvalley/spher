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
  it("renders items as DOM slots with projection CSS variables", () => {
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
    expect(element?.style.getPropertyValue("--spher-x")).toBe("0px")
    expect(element?.style.getPropertyValue("--spher-y")).toBe("0px")
    expect(element?.dataset.spherVisible).toBe("true")
    expect(instance.project("front")?.front).toBe(true)

    instance.destroy()
  })

  it("updates projections without recreating existing elements", () => {
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
    expect(instance.project("item")?.front).toBe(false)
    expect(element?.dataset.spherVisible).toBe("false")

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
