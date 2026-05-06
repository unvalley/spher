# spher

`spher` is a small canvas-first sphere layout engine with a React binding.

https://github.com/user-attachments/assets/fdd3f7f9-761b-4bba-bfd2-dafc9f3ec17a

## Install

```sh
npm install spher
```

## Quick Start

```tsx
import { Spher } from "spher/react";

const items = [
  {
    id: "tokyo",
    cover: "/tokyo.jpg",
  },
  {
    id: "sf",
    cover: "/sf.jpg",
  },
];

export function Globe() {
  return (
    <Spher
      className="sphere"
      controls={{ autoRotate: { speed: 0.18 }, drag: true, wheel: true }}
      items={items}
      onItemSelect={(item) => console.log("selected", item.id)}
      perspective={900}
      position={(item) =>
        item.id === "tokyo"
          ? { latitude: 35.6762, longitude: 139.6503 }
          : { latitude: 37.7749, longitude: -122.4194 }
      }
      radius="auto"
      size={{ ratio: 0.1 }}
    />
  );
}
```

```css
.sphere {
  cursor: grab;
  width: 480px;
}

.sphere:active {
  cursor: grabbing;
}
```

## API

### React

Use `Spher` from `spher/react` when you want React to own the canvas element and lifecycle while spher keeps dense rendering on canvas.

```tsx
import { Spher } from "spher/react";
```

`Spher` exposes spher options as component props and keeps DOM selection separate through `onItemSelect`.

```tsx
<Spher
  items={items}
  radius="auto"
  size={{ ratio: 0.08 }}
/>
```

### `createSpher(canvas, options)`

The root `createSpher` export draws into an existing `<canvas>` and owns pointer, wheel, and keyboard controls when enabled.

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
  zoom: { value: 1 },
  placement: "fibonacci",
  controls: { drag: true, keyboard: true, wheel: true },
});
```

The instance exposes:

```ts
type SpherInstance = {
  update: (patch) => void;
  select: (id: string | null) => void;
  rotateTo: (rotation) => void;
  destroy: () => void;
  itemState: (id: string) => SpherRenderState | null;
  getState: () => SpherState;
  subscribe: (listener) => () => void;
};
```

### Items

Items need a stable `id`. Add `cover` when you want the default framed-card renderer.

```ts
const items = [
  { id: "tokyo", cover: "/tokyo.jpg", label: "Tokyo" },
  { id: "sf", cover: "/sf.jpg", label: "San Francisco" },
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

Use `faceMode` when your renderer treats cards as having a main cover side. `face-out` marks the exterior-facing side as the cover side; `face-in` marks the interior-facing side as the cover side. Read `state.coverVisible` in your renderer to choose between cover and back-side drawing.

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

### Cards

Use `cover` on each item for the common framed-card case. It can be a URL string or any drawable `CanvasImageSource`, including images, videos, canvases, and image bitmaps. Pass `card` only when you want to tune the default card drawing.

```ts
createSpher(canvas, {
  items: [
    { id: "tokyo", cover: "/tokyo.jpg" },
    { id: "sf", cover: "/sf.jpg" },
  ],
  radius: "auto",
  size: { ratio: 0.08 },
  card: {
    borderColor: "rgb(15 23 42 / 16%)",
    selectedBorderColor: "rgb(17 24 39 / 96%)",
  },
});
```

### Low-Level Canvas Rendering

Use `render` to draw each projected item. The canvas transform is already positioned on the sphere card before your function runs, so draw around `(0, 0)`.

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

## Demo

See [demo/react](demo/react) for a styled React example built on `Spher` from `spher/react`.
The demo includes philosophy archive cover assets and lets you hide the controls with the `Hide`
button. Press `h` to show the controls again.

## Design Notes

The current design direction is documented in [docs/design-proposal.md](docs/design-proposal.md).

## License

MIT
