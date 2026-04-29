import { createRef } from "react"
import { flushSync } from "react-dom"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it } from "vitest"
import { Spher, type SpherHandle } from "./Spher.js"

const mounted: Array<{ root: Root; element: HTMLElement }> = []

afterEach(() => {
  for (const { root, element } of mounted) {
    root.unmount()
    element.remove()
  }
  mounted.length = 0
})

describe("Spher", () => {
  it("renders unstyled React content into surface DOM slots", async () => {
    const element = document.createElement("div")
    Object.assign(element.style, {
      width: "400px",
      height: "400px",
    })
    document.body.append(element)

    const root = createRoot(element)
    mounted.push({ root, element })

    flushSync(() => {
      root.render(
        <Spher
          items={[{ id: "front" }]}
          perspective={500}
          position={() => ({ latitude: 0, longitude: 0 })}
          radius={100}
          render={(item, state) => (
            <button data-selected={state.selected} type="button">
              {item.id}
            </button>
          )}
        />,
      )
    })

    const slot = element.querySelector<HTMLElement>('[data-spher-item="front"]')
    const button = element.querySelector("button")

    expect(slot).not.toBeNull()
    expect(slot?.style.getPropertyValue("--spher-longitude")).toBe("0deg")
    expect(slot?.parentElement?.dataset.spherLayer).toBe("")
    expect(slot?.dataset.spherVisible).toBe("true")
    expect(button?.textContent).toBe("front")
  })

  it("keeps drag rotation across React rerenders", async () => {
    const element = document.createElement("div")
    Object.assign(element.style, {
      width: "400px",
      height: "400px",
    })
    document.body.append(element)

    const root = createRoot(element)
    const spherRef = createRef<SpherHandle>()
    mounted.push({ root, element })

    flushSync(() => {
      root.render(
        <Spher
          controls={{ drag: true }}
          items={[{ id: "front" }]}
          perspective={500}
          position={() => ({ latitude: 0, longitude: 0 })}
          radius={100}
          ref={spherRef}
          render={(item) => <button type="button">{item.id}</button>}
        />,
      )
    })

    const spherRoot = element.querySelector<HTMLElement>("[data-spher-react]")
    const layer = element.querySelector<HTMLElement>("[data-spher-layer]")
    expect(spherRoot).not.toBeNull()
    expect(layer).not.toBeNull()

    if (!spherRoot) return
    spherRoot.setPointerCapture = () => undefined
    spherRoot.hasPointerCapture = () => true
    spherRoot.releasePointerCapture = () => undefined

    spherRoot.dispatchEvent(
      new PointerEvent("pointerdown", {
        bubbles: true,
        clientX: 100,
        clientY: 100,
        pointerId: 1,
      }),
    )
    spherRoot.dispatchEvent(
      new PointerEvent("pointermove", {
        bubbles: true,
        clientX: 140,
        clientY: 90,
        pointerId: 1,
      }),
    )
    spherRoot.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, pointerId: 1 }))

    await waitFrames(24)

    expect(spherRef.current?.getState().rotation.x).toBeCloseTo(0.8, 1)
    expect(spherRef.current?.getState().rotation.y).toBeCloseTo(3.2, 1)
    expect(layer?.style.transform).toContain("rotateX")
    expect(layer?.style.transform).toContain("rotateY")
  })

  it("rotates with arrow keys when keyboard controls are enabled", async () => {
    const element = document.createElement("div")
    Object.assign(element.style, {
      width: "400px",
      height: "400px",
    })
    document.body.append(element)

    const root = createRoot(element)
    const spherRef = createRef<SpherHandle>()
    mounted.push({ root, element })

    flushSync(() => {
      root.render(
        <Spher
          controls={{ keyboard: true }}
          items={[{ id: "front" }]}
          perspective={500}
          position={() => ({ latitude: 0, longitude: 0 })}
          radius={100}
          ref={spherRef}
          render={(item) => <button type="button">{item.id}</button>}
        />,
      )
    })

    window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }))
    await waitFrames(24)

    expect(spherRef.current?.getState().rotation.y).toBeCloseTo(1, 1)
  })

  it("does not rerender React item content during rotation", async () => {
    const element = document.createElement("div")
    Object.assign(element.style, {
      width: "400px",
      height: "400px",
    })
    document.body.append(element)

    const root = createRoot(element)
    const spherRef = createRef<SpherHandle>()
    let renderCount = 0
    mounted.push({ root, element })

    flushSync(() => {
      root.render(
        <Spher
          controls={{ keyboard: true }}
          items={[{ id: "front" }]}
          perspective={500}
          position={() => ({ latitude: 0, longitude: 0 })}
          radius={100}
          ref={spherRef}
          render={(item) => {
            renderCount += 1
            return <button type="button">{item.id}</button>
          }}
        />,
      )
    })

    await waitFrames(2)
    const renderCountBeforeRotation = renderCount

    window.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" }))
    await waitFrames(24)

    expect(spherRef.current?.getState().rotation.y).toBeCloseTo(1, 1)
    expect(renderCount).toBe(renderCountBeforeRotation)
  })
})

const waitFrames = async (count: number) => {
  for (let index = 0; index < count; index += 1) {
    await new Promise((resolve) => requestAnimationFrame(resolve))
  }
}
