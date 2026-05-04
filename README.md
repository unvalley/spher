# spher

`spher` is a small canvas-first sphere layout engine.

https://github.com/user-attachments/assets/fdd3f7f9-761b-4bba-bfd2-dafc9f3ec17a

## Install

```sh
npm install spher
```

## Quick Start

```ts
import { createSurfaceSpher } from "spher";

const canvas = document.querySelector<HTMLCanvasElement>("#sphere");

if (canvas) {
  const items = [
    {
      id: "tokyo",
      label: "Tokyo",
      tone: "city",
    },
    {
      id: "sf",
      label: "San Francisco",
      tone: "coast",
    },
  ];

  const sphere = createSurfaceSpher(canvas, {
    colors: {
      city: ["#dbeafe", "#60a5fa"],
      coast: ["#dcfce7", "#34d399"],
    },
    controls: {
      autoRotate: { speed: 0.18 },
      drag: true,
      wheel: true,
    },
    items,
    perspective: 900,
    position: (item) =>
      item.id === "tokyo"
        ? { latitude: 35.6762, longitude: 139.6503 }
        : { latitude: 37.7749, longitude: -122.4194 },
    radius: 320,
    render: (context, item, _state, frame) => {
      context.fillStyle = "#0f172a";
      context.font = "600 12px system-ui";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(item.label, 0, frame.mediaY + frame.mediaHeight / 2);
    },
    size: { ratio: 0.1 },
    tone: (item) => item.tone,
    onSelect: (item) => {
      console.log("selected", item.id);
    },
  });

  sphere.rotateTo({ x: 8, y: 24 });

  // Later:
  // sphere.destroy();
}
```

```css
#sphere {
  cursor: grab;
  width: 480px;
  height: 480px;
  touch-action: none;
}

#sphere:active {
  cursor: grabbing;
}
```

## API

### `createSpher(canvas, options)`

The main `createSpher` export is an alias of `createSpherCanvas`. It draws into an existing `<canvas>` and owns pointer, wheel, and keyboard controls when enabled.

```ts
import { createSpher } from "spher";
```

```ts
const instance = createSpher(canvas, {
  items,
  radius: 320,
  perspective: 900,
  rotation: { x: 0, y: 0 },
  tilt: { x: 12 },
  zoom: 1,
  placement: "fibonacci",
  controls: true,
});
```

The instance exposes:

```ts
type SpherCanvasInstance = {
  update: (patch) => void;
  select: (id: string | null) => void;
  rotateTo: (rotation) => void;
  destroy: () => void;
  itemState: (id: string) => SpherCanvasRenderState | null;
  getState: () => SpherCanvasState;
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

createSpher(canvas, {
  items,
  position: (item) =>
    item.id === "tokyo"
      ? { latitude: 35.6762, longitude: 139.6503 }
      : { latitude: 37.7749, longitude: -122.4194 },
  size: (item) => (item.id === "tokyo" ? 72 : 56),
});
```

For responsive surfaces, pass `"auto"` to derive the size from the resolved sphere diameter, or pass a ratio when the surface should scale with the displayed sphere.

```ts
createSpher(canvas, {
  items,
  radius: "auto",
  size: { ratio: 0.09 },
});
```

Use `faceMode` when your renderer treats surfaces as having a main image side. `face-out` marks the exterior-facing side as the image side; `face-in` marks the interior-facing side as the image side. Read `state.imageVisible` in your renderer to choose between image and back-side drawing.

```ts
createSpher(canvas, {
  items,
  faceMode: "face-in",
});
```

Use `tilt` when the sphere should have a fixed base angle while controls continue to own `rotation`. Pass a number for pitch-only tilt, or pass `{ x, y, z }` for pitch, yaw, and roll offsets in degrees.

```ts
createSpher(canvas, {
  items,
  tilt: { x: 12 },
  controls: { autoRotate: true, drag: true },
});
```

### Canvas Rendering

Use `render` to draw each projected item. The canvas transform is already positioned on the sphere surface before your function runs, so draw around `(0, 0)`.

```ts
createSpher(canvas, {
  items,
  render: (context, item, state) => {
    const size = state.item.size;
    context.fillStyle = state.selected ? "#111827" : "#ffffff";
    context.fillRect(-size / 2, -size / 2, size, size);
  },
});
```

The same canvas API is also available from `spher/canvas`.

```ts
import { createSpherCanvas } from "spher/canvas";
```

### Surface Spheres

Use `createSurfaceSpher` when you want spher to handle the sphere, controls, surface frame, front/back visibility, and selection styling while you draw arbitrary canvas content inside each surface.

```ts
import { createSurfaceSpher } from "spher";

const sphere = createSurfaceSpher(canvas, {
  items,
  radius: "auto",
  size: { ratio: 0.08 },
  colors: {
    alert: ["#fee2e2", "#fb7185"],
    metric: ["#dbeafe", "#60a5fa"],
  },
  tone: (item) => item.kind,
  render: (context, item, state, frame) => {
    context.fillStyle = state.selected ? "#020617" : "#334155";
    context.font = "600 11px system-ui";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(item.label, 0, frame.mediaY + frame.mediaHeight / 2);
  },
});
```

### Image Surface Spheres

Use `createImageSurfaceSpher` when the surface content is an image. It creates the renderer, wires it into the canvas sphere, preloads image URLs, and redraws as images load.

```ts
import { createImageSurfaceSpher } from "spher";

const sphere = createImageSurfaceSpher(canvas, {
  items,
  image: (item) => item.image,
  tone: (item) => item.category,
  colors: {
    archive: ["#dbeafe", "#60a5fa"],
    network: ["#fee2e2", "#fb7185"],
  },
  radius: "auto",
  size: { ratio: 0.06 },
  controls: { autoRotate: true, drag: true, wheel: true },
});
```

### Canvas Renderers

Use `createImageSurfaceRenderer` when you want image surfaces like the demo without writing canvas drawing code by hand.

```ts
import { createImageSurfaceRenderer, createSpher } from "spher";

const renderer = createImageSurfaceRenderer({
  image: (item) => item.image,
  tone: (item) => item.category,
  colors: {
    archive: ["#dbeafe", "#60a5fa"],
    network: ["#fee2e2", "#fb7185"],
  },
});

const sphere = createSpher(canvas, {
  items,
  radius: "auto",
  size: { ratio: 0.06 },
  render: renderer,
});

renderer.preload(items, () => sphere.update({}));
```

## Core Utilities

Pure placement utilities are available from `spher/core`.

```ts
import { placeItems } from "spher/core";

const placed = placeItems([{ id: "a" }, { id: "b" }], {
  radius: 320,
  placement: "fibonacci",
});
```

## Demo

See [demo/react](demo/react) for a styled React example built on `createImageSurfaceSpher`.
The demo includes philosophy archive image assets and lets you hide the controls with the `Hide`
button. Press `h` to show the controls again.

## Design Notes

The current design direction is documented in [docs/design-proposal.md](docs/design-proposal.md).

## License

MIT
