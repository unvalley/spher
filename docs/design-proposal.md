# spher design notes

## Direction

spher should be a small, unstyled sphere layout engine. The package should provide the mechanics for placing real DOM and React components on a rotating sphere, while product-specific styling lives in userland or demos.

The public surface is now centered on:

- `createSpher` from `spher` / `spher/dom`
- `Spher` from `spher/react`
- pure geometry helpers from `spher/core`

The root `spher` entry should stay framework-agnostic. Framework adapters are exported only from subpaths such as `spher/react`.

Styled archive UI is intentionally not part of the library API. An archive-style example lives in `demo/react`.

## Package Layers

```txt
src/
├─ core      pure placement, projection, and hit-test utilities
├─ dom       framework-agnostic DOM engine
├─ Spher.tsx  unstyled React wrapper around the DOM engine
├─ react.ts  React export entry
└─ index.ts  root export entry
```

## API Shape

### DOM

```ts
import { createSpher } from "spher";

const instance = createSpher(root, {
  items: [{ id: "tokyo", label: "Tokyo" }],
  getItemPosition: () => ({ latitude: 35.6762, longitude: 139.6503 }),
  controls: { drag: true, wheel: true },
  renderItem: (item, element) => {
    element.textContent = item.label;
  },
});
```

`createSpher` owns projection, selection, controls, DOM style variables, and cleanup.

### React

```tsx
import { Spher } from "spher/react";

<Spher
  items={items}
  className="sphere"
  controls={{ drag: true, wheel: true }}
  getItemPosition={(item) => item.coordinates}
  renderItem={(item, state) => (
    <button data-selected={state.selected}>{item.label}</button>
  )}
/>;
```

`Spher` is unstyled. It renders wrappers for each item, connects them to `createSpher`, and passes minimal render state to `renderItem`.

## Item Model

Items only require `id`. Coordinates and sizes are resolved through options:

```ts
createSpher(root, {
  items,
  getItemPosition: (item) => item.coordinates,
  getItemSize: (item) => item.cardSize,
});
```

This keeps spher fields from colliding with user domain data.

## Styling Contract

The DOM engine writes state to CSS variables and data attributes:

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

The package should not ship Tailwind-based component styling. Demos can use any styling they need.

## Demo Strategy

`demo/react` contains a styled archive example built with `Spher`. This keeps the package API generic while still showing a rich archive experience.

## Test Strategy

Use three checks:

```sh
pnpm run build
pnpm test
pnpm test:browser
```

- Node Vitest tests cover pure `core` functions.
- Vitest browser mode + Playwright covers DOM engine behavior.
- React browser tests cover `Spher` integration with real DOM slots.

## Next Steps

- Add examples for controlled rotation and externally owned DOM nodes.
- Split `create-spher.ts` into renderer, controls, and state modules as behavior grows.
- Keep `Spher` unstyled and avoid adding preset UI back into `src`.
