# orba

`orba` is a small sphere layout engine for DOM and React components.

Use it when you want to place real interface elements on a rotating sphere: cards, labels, buttons, images, links, or any DOM node you control. The low-level API is framework-agnostic, and the React component is unstyled.

## Install

```sh
npm install orba
```

## Quick Start

```ts
import { createOrba } from "orba";

const root = document.querySelector<HTMLElement>("#sphere");

if (root) {
  const sphere = createOrba(root, {
    radius: 320,
    perspective: 900,
    controls: {
      drag: true,
      wheel: true,
    },
    items: [
      {
        id: "tokyo",
        position: { latitude: 35.6762, longitude: 139.6503 },
        size: 72,
      },
      {
        id: "sf",
        position: { latitude: 37.7749, longitude: -122.4194 },
        size: 56,
      },
    ],
    renderItem: (item, element) => {
      element.className = "city";
      element.textContent = item.id;
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
  opacity: var(--orba-visibility);
  transform:
    translate(-50%, -50%)
    translate3d(var(--orba-x), var(--orba-y), 0)
    scale(var(--orba-scale));
}
```

## API

### `createOrba(root, options)`

`createOrba` mounts a DOM sphere engine into an existing element.

```ts
import { createOrba } from "orba";
```

```ts
const instance = createOrba(root, {
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
type OrbaDomInstance = {
  update: (patch) => void;
  destroy: () => void;
  project: (id: string) => OrbaDomProjection | null;
  getState: () => OrbaDomState;
  subscribe: (listener) => () => void;
};
```

### Items

Items only need an `id`. You can provide explicit spherical coordinates or let orba place them.

```ts
const items = [
  { id: "a" },
  { id: "b", size: 88 },
  { id: "tokyo", position: { latitude: 35.6762, longitude: 139.6503 } },
  { id: "sf", latitude: 37.7749, longitude: -122.4194 },
];
```

### DOM Slots

Use `renderItem` when orba should create item elements for you.

```ts
createOrba(root, {
  items,
  renderItem: (item, element) => {
    element.textContent = item.id;
  },
});
```

Use `getElement` when you already own the DOM.

```ts
createOrba(root, {
  items,
  getElement: (item) => document.querySelector(`[data-node="${item.id}"]`),
});
```

orba writes projection state to CSS variables and data attributes:

```txt
--orba-x
--orba-y
--orba-z
--orba-scale
--orba-edge
--orba-visibility
--orba-selected
data-orba-item
data-orba-visible
data-orba-front
data-orba-selected
```

## Core Utilities

Pure placement and projection utilities are available from `orba/core`.

```ts
import { placeItems, projectItems } from "orba/core";

const placed = placeItems([{ id: "a" }, { id: "b" }], 320, "fibonacci");
const projected = projectItems(placed, { x: 0, y: 20 }, 1, 900);
```

The older archive-focused `positionItems` export is still available for compatibility.

## React

The React API exports an unstyled `Orba` component. It renders your elements and lets the DOM engine write projection state to their wrappers.

```tsx
import { Orba } from "orba/react";

const items = [
  { id: "tokyo", position: { latitude: 35.6762, longitude: 139.6503 } },
  { id: "sf", position: { latitude: 37.7749, longitude: -122.4194 } },
];

export const Example = () => (
  <Orba
    className="sphere"
    items={items}
    controls={{ drag: true, wheel: true }}
    renderItem={(item, state) => (
      <button data-selected={state.selected}>{item.id}</button>
    )}
  />
);
```

The archive-style UI that used to live in the package is now a demo instead of a library component. See [demo/react](demo/react) for a styled React example built with `Orba`.


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
