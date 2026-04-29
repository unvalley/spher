# orba design notes

## Direction

orba should be a small, unstyled sphere layout engine. The package should provide the mechanics for placing real DOM and React components on a rotating sphere, while product-specific styling lives in userland or demos.

The public surface is now centered on:

- `createOrba` from `orba` / `orba/dom`
- `Orba` from `orba/react`
- pure geometry helpers from `orba/core`

Styled archive UI is intentionally not part of the library API. An archive-style example lives in `demo/react`.

## Package Layers

```txt
src/
├─ core      pure placement, projection, and hit-test utilities
├─ dom       framework-agnostic DOM engine
├─ Orba.tsx  unstyled React wrapper around the DOM engine
├─ react.ts  React export entry
└─ index.ts  root export entry
```

## API Shape

### DOM

```ts
import { createOrba } from "orba";

const instance = createOrba(root, {
  items: [{ id: "tokyo", label: "Tokyo" }],
  getItemPosition: () => ({ latitude: 35.6762, longitude: 139.6503 }),
  controls: { drag: true, wheel: true },
  renderItem: (item, element) => {
    element.textContent = item.label;
  },
});
```

`createOrba` owns projection, selection, controls, DOM style variables, and cleanup.

### React

```tsx
import { Orba } from "orba/react";

<Orba
  items={items}
  className="sphere"
  controls={{ drag: true, wheel: true }}
  getItemPosition={(item) => item.coordinates}
  renderItem={(item, state) => (
    <button data-selected={state.selected}>{item.label}</button>
  )}
/>;
```

`Orba` is unstyled. It renders wrappers for each item, connects them to `createOrba`, and passes minimal render state to `renderItem`.

## Item Model

Items only require `id`. Coordinates and sizes are resolved through options:

```ts
createOrba(root, {
  items,
  getItemPosition: (item) => item.coordinates,
  getItemSize: (item) => item.cardSize,
});
```

This keeps orba fields from colliding with user domain data.

## Styling Contract

The DOM engine writes state to CSS variables and data attributes:

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

The package should not ship Tailwind-based component styling. Demos can use any styling they need.

## Demo Strategy

`demo/react` contains a styled archive example built with `Orba`. This keeps the package API generic while still showing a rich archive experience.

## Test Strategy

Use three checks:

```sh
pnpm run build
pnpm test
pnpm test:browser
```

- Node Vitest tests cover pure `core` functions.
- Vitest browser mode + Playwright covers DOM engine behavior.
- React browser tests cover `Orba` integration with real DOM slots.

## Next Steps

- Add examples for controlled rotation and externally owned DOM nodes.
- Split `create-orba.ts` into renderer, controls, and state modules as behavior grows.
- Keep `Orba` unstyled and avoid adding preset UI back into `src`.
