# spher

`spher` is a small sphere layout engine for DOM and React components.

Use it when you want to place real interface elements on a rotating sphere: cards, labels, buttons, images, links, or any DOM node you control. The low-level API is framework-agnostic, and the React component is unstyled.

## Install

```sh
npm install spher
```

## Quick Start

```ts
import { createSpher } from "spher";

const root = document.querySelector<HTMLElement>("#sphere");

if (root) {
  const sphere = createSpher(root, {
    radius: 320,
    perspective: 900,
    controls: {
      drag: true,
      wheel: true,
    },
    items: [
      { id: "tokyo", label: "Tokyo" },
      { id: "sf", label: "San Francisco" },
    ],
    getItemPosition: (item) =>
      item.id === "tokyo"
        ? { latitude: 35.6762, longitude: 139.6503 }
        : { latitude: 37.7749, longitude: -122.4194 },
    getItemSize: (item) => (item.id === "tokyo" ? 72 : 56),
    renderItem: (item, element) => {
      element.className = "city";
      element.textContent = item.label;
    },
    onSelect: (item) => {
      console.log("selected", item.id);
    },
  });

  sphere.update({
    rotation: { x: 8, y: 24 },
  });

  // Later:
  // sphere.destroy();
}
```

```css
#sphere {
  width: 480px;
  height: 480px;
}

.city {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  border: 1px solid color-mix(in srgb, currentColor 18%, transparent);
  border-radius: 999px;
  background: white;
  box-shadow: 0 16px 40px rgb(15 23 42 / 16%);
  opacity: var(--spher-visibility);
  transform:
    translate(-50%, -50%)
    translate3d(var(--spher-x), var(--spher-y), 0)
    scale(var(--spher-scale));
}
```

## API

### `createSpher(root, options)`

`createSpher` mounts a DOM sphere engine into an existing element.

```ts
import { createSpher } from "spher";
```

```ts
const instance = createSpher(root, {
  items,
  radius: 320,
  perspective: 900,
  rotation: { x: 0, y: 0 },
  zoom: 1,
  placement: "fibonacci",
  controls: true,
});
```

The instance exposes:

```ts
type SpherDomInstance = {
  update: (patch) => void;
  destroy: () => void;
  project: (id: string) => SpherDomProjection | null;
  getState: () => SpherDomState;
  subscribe: (listener) => () => void;
};
```

### Items

Items only need an `id`. Keep your domain data on the item and use resolver options when you want explicit coordinates or sizes.

```ts
const items = [
  { id: "tokyo", label: "Tokyo" },
  { id: "sf", label: "San Francisco" },
];

createSpher(root, {
  items,
  getItemPosition: (item) =>
    item.id === "tokyo"
      ? { latitude: 35.6762, longitude: 139.6503 }
      : { latitude: 37.7749, longitude: -122.4194 },
  getItemSize: (item) => (item.id === "tokyo" ? 72 : 56),
});
```

### DOM Slots

Use `renderItem` when spher should create item elements for you.

```ts
createSpher(root, {
  items,
  renderItem: (item, element) => {
    element.textContent = item.id;
  },
});
```

Use `getElement` when you already own the DOM.

```ts
createSpher(root, {
  items,
  getElement: (item) => document.querySelector(`[data-node="${item.id}"]`),
});
```

spher writes projection state to CSS variables and data attributes:

```txt
--spher-x
--spher-y
--spher-z
--spher-scale
--spher-edge
--spher-visibility
--spher-selected
data-spher-item
data-spher-visible
data-spher-front
data-spher-selected
```

## Core Utilities

Pure placement and projection utilities are available from `spher/core`.

```ts
import { placeItems, projectItems } from "spher/core";

const placed = placeItems([{ id: "a" }, { id: "b" }], 320, "fibonacci");
const projected = projectItems(placed, { x: 0, y: 20 }, 1, 900);
```

## React

The React adapter is available from `spher/react`. It exports an unstyled `Spher` component that renders your elements and lets the DOM engine write projection state to their wrappers.

```tsx
import { Spher } from "spher/react";

const items = [
  { id: "tokyo", label: "Tokyo" },
  { id: "sf", label: "San Francisco" },
];

export const Example = () => (
  <Spher
    className="sphere"
    items={items}
    controls={{ drag: true, wheel: true }}
    getItemPosition={(item) =>
      item.id === "tokyo"
        ? { latitude: 35.6762, longitude: 139.6503 }
        : { latitude: 37.7749, longitude: -122.4194 }
    }
    renderItem={(item, state) => (
      <button data-selected={state.selected}>{item.label}</button>
    )}
  />
);
```

The archive-style UI that used to live in the package is now a demo instead of a library component. See [demo/react](demo/react) for a styled React example built with `Spher`.

## Testing

The project uses Node-based Vitest tests for pure core utilities and Vitest browser mode with Playwright for DOM behavior.

```sh
pnpm run build
pnpm test
pnpm test:browser
```

## Design Notes

The current design direction is documented in [docs/design-proposal.md](docs/design-proposal.md).

## License

MIT
