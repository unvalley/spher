# spher design notes

## Direction

spher should be a small sphere layout engine with low-level rendering hooks and a few first-party canvas renderers. The package should provide the mechanics for placing image surfaces, labels, or custom marks on a rotating sphere, while product-specific application UI lives in userland or demos.

The public surface is now centered on:

- `createSpher` from `spher`
- `createSurfaceSpher` for common framed surface compositions
- `createImageSurfaceSpher` as an image-specific convenience preset
- canvas renderer helpers such as `createSurfaceRenderer` and `createImageSurfaceRenderer`
- pure geometry helpers from `spher/core`

The root `spher` entry should stay framework-agnostic and canvas-first. A full DOM or React renderer should not be a primary package surface unless it can prove stable frame times with realistic surface counts.

Styled archive UI is intentionally not part of the library API. Reusable primitives such as a generic surface renderer and an image-surface renderer can live in the package, and an archive-style composition lives in `demo/react`.

## Package Layers

```txt
src/
├─ core        pure placement utilities
├─ canvas      canvas renderer, controls, and canvas presets
└─ index.ts    root canvas-first export entry
```

## API Shape

### Canvas

```ts
import { createSurfaceSpher } from "spher";
const items = [{ id: "tokyo", category: "archive", label: "Tokyo" }];

const instance = createSurfaceSpher(canvas, {
  colors: {
    archive: ["#dbeafe", "#60a5fa"],
    instrument: ["#dcfce7", "#34d399"],
  },
  items,
  position: () => ({ latitude: 35.6762, longitude: 139.6503 }),
  radius: "auto",
  size: { ratio: 0.08 },
  tone: (item) => item.category,
  controls: { drag: true, wheel: true },
  render: (context, item, state, frame) => {
    context.fillStyle = state.selected ? "#020617" : "#334155";
    context.fillText(item.label, 0, frame.mediaY + frame.mediaHeight / 2);
  },
});
```

`createSpher` owns surface placement, projection, selection, controls, canvas sizing, and cleanup. `createSurfaceSpher` composes the default surface frame with custom content rendering. `createImageSurfaceSpher` layers image loading and cover rendering on top of that generic surface primitive. Renderer helpers reduce the amount of user code needed for common visual patterns without forcing a product-specific component API.

### DOM Overlays

DOM is still useful for sparse UI that needs real accessibility, text selection, focus, popovers, or framework components. It should be treated as an overlay layer fed by canvas state, not as the dense surface renderer.

If a DOM binding API is added later, it should be explicitly bounded: selected item, hovered item, labels, or a small visible subset. It must not trigger React renders every frame, and it should update only imperative transforms or CSS variables for the mounted overlay nodes.

## Item Model

Items only require `id`. Coordinates and sizes are resolved through options:

```ts
createSpher(canvas, {
  items,
  position: (item) => item.coordinates,
  size: (item) => item.surfaceSize,
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
imageVisible
visibleSide
viewMode
```

The package should not ship Tailwind-based component styling. Demos can use any styling they need, while reusable canvas drawing primitives should be exposed as renderer helpers instead of copied into each demo.

## Demo Strategy

`demo/react` contains a styled archive example built with `createSpher` and first-party canvas renderers. This keeps the package API generic while still showing a rich archive experience with a small amount of userland code.

## Test Strategy

Use three checks:

```sh
pnpm run build
pnpm test
pnpm test:browser
```

- Node Vitest tests cover pure `core` functions.
- Vitest browser mode + Playwright covers canvas behavior.
- Renderer preset tests cover image loading, selection state, and visible-side behavior.

## Next Steps

- Keep dense archive/surface rendering on canvas.
- Add examples for controlled rotation and external UI controls.
- Consider a sparse overlay API only after measuring realistic frame times.
- Split canvas internals into renderer, controls, and state modules as behavior grows.
