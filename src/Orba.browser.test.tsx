import { flushSync } from "react-dom";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import { Orba } from "./Orba.js";

const mounted: Array<{ root: Root; element: HTMLElement }> = [];

afterEach(() => {
  for (const { root, element } of mounted) {
    root.unmount();
    element.remove();
  }
  mounted.length = 0;
});

describe("Orba", () => {
  it("renders unstyled React content into projected DOM slots", async () => {
    const element = document.createElement("div");
    Object.assign(element.style, {
      width: "400px",
      height: "400px",
    });
    document.body.append(element);

    const root = createRoot(element);
    mounted.push({ root, element });

    flushSync(() => {
      root.render(
        <Orba
          items={[{ id: "front", position: { latitude: 0, longitude: 0 } }]}
          radius={100}
          perspective={500}
          renderItem={(item, state) => (
            <button type="button" data-selected={state.selected}>
              {item.id}
            </button>
          )}
        />,
      );
    });

    const slot = element.querySelector<HTMLElement>('[data-orba-item="front"]');
    const button = element.querySelector("button");

    expect(slot).not.toBeNull();
    expect(slot?.style.getPropertyValue("--orba-x")).toBe("0px");
    expect(slot?.dataset.orbaVisible).toBe("true");
    expect(button?.textContent).toBe("front");
  });
});
