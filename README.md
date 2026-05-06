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
    label: "Tokyo",
    cover: "/tokyo.jpg",
    tone: "city",
  },
  {
    id: "sf",
    label: "San Francisco",
    cover: "/sf.jpg",
    tone: "coast",
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
      card={{
        colors: {
          city: ["#dbeafe", "#60a5fa"],
          coast: ["#dcfce7", "#34d399"],
        },
        cover: (item) => item.cover,
        title: (item) => item.label,
        tone: (item) => item.tone,
      }}
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
import { Spher, useSpher } from "spher/react";
```

`Spher` exposes spher options as component props and keeps DOM selection separate through `onItemSelect`.

```tsx
<Spher
  items={items}
  radius="auto"
  size={{ ratio: 0.08 }}
  card={{
    cover: (item) => item.thumbnail,
    title: (item) => item.name,
  }}
/>
```

Use `useSpher` when you need to place the `<canvas>` yourself.

```tsx
const { canvasRef, instanceRef } = useSpher({
  items,
  card: { cover: (item) => item.thumbnail },
});

return <canvas ref={canvasRef} />;
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

Use `card` for the common framed-cover case. `cover` can return a URL string or any drawable `CanvasImageSource`, including images, videos, canvases, and image bitmaps.

```ts
createSpher(canvas, {
  items,
  radius: "auto",
  size: { ratio: 0.08 },
  card: {
    cover: (item) => item.preview,
    title: (item) => item.label,
    subtitle: (item) => item.kind,
    tone: (item) => item.kind,
    colors: {
      alert: ["#fee2e2", "#fb7185"],
      metric: ["#dbeafe", "#60a5fa"],
    },
  },
});
```

For custom canvas content inside a framed card, compose `createCardRenderer` with `render`.

```ts
const renderer = createCardRenderer({
  render: (context, item, state, frame) => {
    context.fillStyle = state.selected ? "#020617" : "#334155";
    context.font = "600 11px system-ui";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(item.label, 0, frame.coverY + frame.coverHeight / 2);
  },
});

createSpher(canvas, {
  items,
  render: renderer,
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

The same canvas API is also available from `spher/canvas`.

```ts
import { createSpher } from "spher/canvas";
```

### Canvas Renderers

Use `createCardRenderer` when you want the card frame preset while wiring the low-level canvas instance yourself.

```ts
import { createCardRenderer, createSpher } from "spher";

const renderer = createCardRenderer({
  tone: (item) => item.category,
  colors: {
    archive: ["#dbeafe", "#60a5fa"],
    network: ["#fee2e2", "#fb7185"],
  },
  render: (context, item, _state, frame) => {
    context.fillStyle = "#0f172a";
    context.fillText(item.label, 0, frame.coverY + frame.coverHeight / 2);
  },
});

const sphere = createSpher(canvas, {
  items,
  radius: "auto",
  size: { ratio: 0.06 },
  render: renderer,
});
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

See [demo/react](demo/react) for a styled React example built on `Spher` from `spher/react`.
The demo includes philosophy archive cover assets and lets you hide the controls with the `Hide`
button. Press `h` to show the controls again.

## Design Notes

The current design direction is documented in [docs/design-proposal.md](docs/design-proposal.md).

## License

MIT
