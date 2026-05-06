# spher design notes

## Direction

spher should be a small sphere layout engine with low-level rendering hooks, a declarative card preset, and a thin React binding. The package should provide the mechanics for placing cover cards, labels, or custom marks on a rotating sphere, while product-specific application UI lives in userland or demos.

The public card is now centered on:

- `createSpher` from `spher`
- `Spher` and `useSpher` from `spher/react`
- canvas renderer helpers such as `createCardRenderer`
- pure geometry helpers from `spher/core`

The root `spher` entry should stay framework-agnostic and canvas-first. The React entry should own lifecycle ergonomics only; it should not turn dense sphere items into DOM nodes.

Styled archive UI is intentionally not part of the library API. Reusable primitives such as a generic card renderer can live in the package, and an archive-style composition lives in `demo/react`.

## Package Layers

```txt
src/
├─ core        pure placement utilities
├─ canvas      canvas renderer, controls, and canvas presets
├─ react       React lifecycle binding around the canvas engine
└─ index.ts    root canvas-first export entry
```

## API Shape

### Canvas

```ts
import { createSpher } from "spher";
const items = [{ id: "tokyo", category: "archive", label: "Tokyo" }];

const instance = createSpher(canvas, {
  items,
  position: () => ({ latitude: 35.6762, longitude: 139.6503 }),
  radius: "auto",
  size: { ratio: 0.08 },
  controls: { drag: true, wheel: true },
  card: {
    colors: {
      archive: ["#dbeafe", "#60a5fa"],
      instrument: ["#dcfce7", "#34d399"],
    },
    title: (item) => item.label,
    tone: (item) => item.category,
  },
});
```

`createSpher` owns card placement, projection, selection, controls, canvas sizing, and cleanup. Its `card` option covers the common framed-cover recipe without requiring users to write canvas drawing code. Renderer helpers reduce the amount of user code needed for common visual patterns without forcing a product-specific component API.

### React

```tsx
import { Spher } from "spher/react";

<Spher
  items={items}
  radius="auto"
  size={{ ratio: 0.08 }}
  card={{
    cover: (item) => item.preview,
    title: (item) => item.label,
  }}
/>;
```

The React binding should be a declarative owner for the canvas element and instance updates. It should not be a DOM renderer. React children are intentionally not accepted as sphere items; use `card` recipes or canvas render hooks instead.

### DOM Overlays

DOM is still useful for sparse UI that needs real accessibility, text selection, focus, popovers, or framework components. It should be treated as an overlay layer fed by canvas state, not as the dense card renderer.

If a DOM binding API is added later, it should be explicitly bounded: selected item, hovered item, labels, or a small visible subset. It must not trigger React renders every frame, and it should update only imperative transforms or CSS variables for the mounted overlay nodes.

## Item Model

Items only require `id`. Coordinates and sizes are resolved through options:

```ts
createSpher(canvas, {
  items,
  position: (item) => item.coordinates,
  size: (item) => item.cardSize,
});
```

This keeps spher fields from colliding with user domain data.

## Rendering Contract

The canvas engine calls the user renderer after applying the projected item transform. The renderer receives a stable render state:

```txt
item
selected
visible
visibility
coverVisible
visibleSide
viewMode
```

The package should not ship Tailwind-based component styling. Demos can use any styling they need, while reusable canvas drawing primitives should be exposed as renderer helpers instead of copied into each demo.

## Demo Strategy

`demo/react` contains a styled archive example built with `Spher` and the root `card` preset. This keeps the package API generic while still showing a rich archive experience with a small amount of userland code.

## Test Strategy

Use three checks:

```sh
pnpm run build
pnpm test
pnpm test:browser
```

- Node Vitest tests cover pure `core` functions.
- Vitest browser mode + Playwright covers canvas behavior.
- Renderer preset tests cover cover loading, selection state, and visible-side behavior.

## Next Steps

- Keep dense archive/card rendering on canvas.
- Add examples for controlled rotation and external UI controls.
- Consider a sparse overlay API only after measuring realistic frame times.
- Split canvas internals into renderer, controls, and state modules as behavior grows.
