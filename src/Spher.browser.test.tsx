import { flushSync } from "react-dom"
import { createRoot, type Root } from "react-dom/client"
import { afterEach, describe, expect, it } from "vitest"
import { Spher } from "./Spher.js"

const mounted: Array<{ root: Root; element: HTMLElement }> = []

afterEach(() => {
  for (const { root, element } of mounted) {
    root.unmount()
    element.remove()
  }
  mounted.length = 0
})

describe("Spher", () => {
  it("renders unstyled React content into projected DOM slots", async () => {
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
    expect(slot?.style.getPropertyValue("--spher-x")).toBe("0px")
    expect(slot?.dataset.spherVisible).toBe("true")
    expect(button?.textContent).toBe("front")
  })
})
