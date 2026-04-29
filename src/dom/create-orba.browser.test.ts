import { afterEach, describe, expect, it } from "vitest";
import { createOrba } from "./create-orba.js";

const roots: HTMLElement[] = [];

const createRoot = () => {
  const root = document.createElement("div");
  Object.assign(root.style, {
    width: "400px",
    height: "400px",
  });
  document.body.append(root);
  roots.push(root);
  return root;
};

afterEach(() => {
  for (const root of roots) root.remove();
  roots.length = 0;
});

describe("createOrba", () => {
  it("renders items as DOM slots with projection CSS variables", () => {
    const root = createRoot();
    const instance = createOrba(root, {
      radius: 100,
      perspective: 500,
      items: [
        {
          id: "front",
          position: { latitude: 0, longitude: 0 },
          size: 40,
        },
      ],
      renderItem: (item, element) => {
        element.textContent = item.id;
      },
    });

    const element = root.querySelector<HTMLElement>('[data-orba-item="front"]');

    expect(element).not.toBeNull();
    expect(element?.textContent).toBe("front");
    expect(element?.style.getPropertyValue("--orba-x")).toBe("0px");
    expect(element?.style.getPropertyValue("--orba-y")).toBe("0px");
    expect(element?.dataset.orbaVisible).toBe("true");
    expect(instance.project("front")?.front).toBe(true);

    instance.destroy();
  });

  it("updates projections without recreating existing elements", () => {
    const root = createRoot();
    const instance = createOrba(root, {
      radius: 100,
      perspective: 500,
      items: [{ id: "item", position: { latitude: 0, longitude: 0 } }],
      renderItem: (item, element) => {
        element.textContent = item.id;
      },
    });
    const element = root.querySelector<HTMLElement>('[data-orba-item="item"]');

    instance.update({ rotation: { x: 0, y: 180 } });

    expect(root.querySelector<HTMLElement>('[data-orba-item="item"]')).toBe(
      element,
    );
    expect(instance.project("item")?.front).toBe(false);
    expect(element?.dataset.orbaVisible).toBe("false");

    instance.destroy();
  });

  it("selects visible items through the DOM slot", () => {
    const root = createRoot();
    const selectedIds: string[] = [];
    const instance = createOrba(root, {
      radius: 100,
      perspective: 500,
      items: [{ id: "selectable", position: { latitude: 0, longitude: 0 } }],
      onSelect: (item) => selectedIds.push(item.id),
      renderItem: (item, element) => {
        element.textContent = item.id;
      },
    });

    const element = root.querySelector<HTMLElement>(
      '[data-orba-item="selectable"]',
    );
    element?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(selectedIds).toEqual(["selectable"]);
    expect(instance.getState().selectedId).toBe("selectable");
    expect(element?.dataset.orbaSelected).toBe("true");

    instance.destroy();
  });

  it("cleans up generated DOM on destroy", () => {
    const root = createRoot();
    const instance = createOrba(root, {
      items: [{ id: "temporary" }],
    });

    expect(root.querySelector('[data-orba-item="temporary"]')).not.toBeNull();

    instance.destroy();

    expect(root.querySelector('[data-orba-layer]')).toBeNull();
    expect(root.querySelector('[data-orba-item="temporary"]')).toBeNull();
    expect(root.dataset.orbaRoot).toBeUndefined();
  });
});
