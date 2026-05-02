# spher

`spher` is a small canvas-first sphere layout engine.

Use it when you want to draw cards, labels, images, or custom marks on a rotating sphere. It targets `<canvas>` for smooth dense scenes.

## Install

```sh
npm install spher
```

## Quick Start

```ts
import { createSpher } from "spher";

const canvas = document.querySelector<HTMLCanvasElement>("#sphere");

if (canvas) {
  const sphere = createSpher(canvas, {
    radius: 320,
    perspective: 900,
    controls: {
      autoRotate: { speed: 0.18 },
      drag: true,
      wheel: true,
    },
    items: [
      { id: "tokyo", label: "Tokyo" },
      { id: "sf", label: "San Francisco" },
    ],
    position: (item) =>
      item.id === "tokyo"
        ? { latitude: 35.6762, longitude: 139.6503 }
        : { latitude: 37.7749, longitude: -122.4194 },
    size: (item) => (item.id === "tokyo" ? 72 : 56),
    render: (context, item, state) => {
      const size = state.item.size;
      context.fillStyle = state.selected ? "#111827" : "#ffffff";
      context.strokeStyle = "rgba(15, 23, 42, 0.18)";
      context.lineWidth = 1;
      context.beginPath();
      context.roundRect(-size / 2, -size / 2, size, size, 12);
      context.fill();
      context.stroke();
      context.fillStyle = state.selected ? "#ffffff" : "#111827";
      context.font = "12px sans-serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(item.label, 0, 0);
    },
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
  width: 480px;
  height: 480px;
  touch-action: none;
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

For responsive cards, pass `"auto"` to derive the size from the resolved sphere diameter, or pass a ratio when the card should scale with the displayed sphere.

```ts
createSpher(canvas, {
  items,
  radius: "auto",
  size: { ratio: 0.09 },
});
```

Use `faceMode` when your renderer treats cards as having a main image side. `face-out` marks the exterior-facing side as the image side; `face-in` marks the interior-facing side as the image side. Read `state.imageVisible` in your renderer to choose between image and back-side drawing.

```ts
createSpher(canvas, {
  items,
  faceMode: "face-in",
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

See [demo/react](demo/react) for a styled React example built on `createSpher`.

## Testing

The project uses Node-based Vitest tests for pure core utilities and Vitest browser mode with Playwright for canvas behavior.

```sh
pnpm run build
pnpm test
pnpm test:browser
```

## Design Notes

The current design direction is documented in [docs/design-proposal.md](docs/design-proposal.md).

## License

MIT
