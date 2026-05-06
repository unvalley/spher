# spher options

This document describes the options accepted by `createSpher(canvas, options)` from `spher`.
The React `Spher` component from `spher/react` accepts the same options as props, except
that `onSelect` is exposed as `onItemSelect`.

## Basic Shape

```ts
import { createSpher } from "spher";

const instance = createSpher(canvas, {
  items,
  radius: "auto",
  size: { ratio: 0.1 },
  controls: { drag: true, wheel: true },
});
```

Every item must have a stable `id`. Add `cover` when you want to use the default card renderer.

```ts
type SpherItem = {
  id: string;
  cover?: string | CanvasImageSource | null;
};
```

## Required Options

### `items`

```ts
items: Array<TItem & SpherItem>
```

Items placed on the sphere. Each item must have a stable `id`; it is used for selection,
updates, hit testing, and `itemState(id)`.

When `cover` is a string, `spher` creates and caches an `HTMLImageElement` for the default
card renderer. When `cover` is already a drawable `CanvasImageSource`, it is used directly.

## Layout Options

### `radius`

```ts
radius?: number | "auto"
```

Sphere radius in CSS pixels.

- Default: `320`
- `"auto"`: uses `42%` of the canvas's shorter side and updates on resize
- Number: fixed radius in CSS pixels

### `size`

```ts
size?:
  | number
  | "auto"
  | { ratio?: number; min?: number; max?: number }
  | ((item, index, items) => number)
```

Item size in CSS pixels. This size is passed to the renderer as `state.item.size`.

- Default: `64`
- `"auto"`: `10%` of the resolved sphere diameter
- `{ ratio }`: responsive size based on sphere diameter; default ratio is `0.1`
- `{ min, max }`: clamps responsive sizing
- Function: resolves size per item

### `placement`

```ts
placement?: "fibonacci" | "grid"
```

Controls how items are distributed when `position` is not provided.

- Default: `"fibonacci"`
- `"fibonacci"`: even spherical distribution for arbitrary item counts
- `"grid"`: row-based latitude/longitude layout

### `position`

```ts
position?: (
  item: TItem & SpherItem,
  index: number,
  items: Array<TItem & SpherItem>,
) => { latitude: number; longitude: number } | null | undefined
```

Provides explicit spherical coordinates per item. Coordinates are in degrees.

- `latitude` is clamped to `-82..82`
- `longitude: 0` starts at the front of the camera at default rotation
- Return `null` or `undefined` to fall back to `placement` for that item

## Camera Options

### `perspective`

```ts
perspective?: number
```

Perspective distance in CSS pixels.

- Default: `900`
- Higher values flatten depth
- Lower values make depth scaling stronger

### `rotation`

```ts
rotation?: { x: number; y: number }
```

Current rotation in degrees.

- Default: `{ x: 0, y: 0 }`
- `x`: pitch, clamped to `-72..72` by interactive controls
- `y`: yaw, unbounded

Use `instance.rotateTo(rotation)` or update the option when controlling rotation externally.

### `tilt`

```ts
tilt?: number | { x?: number; y?: number; z?: number }
```

Static pitch/yaw/roll offset applied before user rotation.

- Default: `{ x: 0, y: 0, z: 0 }`
- Number: shorthand for `{ x: value, y: 0, z: 0 }`
- `x`: pitch offset
- `y`: yaw offset
- `z`: roll offset

Use `tilt` for a fixed base angle, and `rotation` for interaction or controlled movement.

### `zoom`

```ts
zoom?: {
  value?: number;
  min?: number;
  max?: number;
  insideThreshold?: number;
}
```

Zoom configuration.

- `value` default: `1`
- `min` default: `0.66`
- `max` default: `4.4`
- `insideThreshold` default: `1.32`

When `value >= insideThreshold`, rendering switches from shell view to inside view.
Inside view uses a derived zoom scale, while the public state still reports the original
`zoom.value`.

## Rendering Options

### `faceMode`

```ts
faceMode?: "face-out" | "face-in"
```

Controls which side of each card is considered the main cover side.

- Default: `"face-out"`
- `"face-out"`: covers face the outside of the sphere
- `"face-in"`: covers face the inside of the sphere

Read `state.coverVisible` in a custom renderer to decide whether to draw the cover or a back side.

### `card`

```ts
card?: {
  borderColor?: string;
  backBorderColor?: string;
  selectedBorderColor?: string;
  borderWidth?: number;
  selectedBorderWidth?: number;
}
```

Drawing options for the default framed-card renderer. This option is only used when `render`
is not provided.

Defaults:

- `borderColor`: `"rgba(15, 23, 42, 0.16)"`
- `backBorderColor`: `borderColor` or `"rgba(15, 23, 42, 0.2)"`
- `selectedBorderColor`: `"rgba(17, 24, 39, 0.96)"`
- `borderWidth`: `1`
- `selectedBorderWidth`: `2`

### `render`

```ts
render?: (
  context: CanvasRenderingContext2D,
  item: TItem & SpherItem,
  state: SpherRenderState<TItem>,
) => void
```

Low-level canvas renderer for each visible item. Before `render` runs, the canvas transform
has already been moved and projected onto the item's card plane, so draw around `(0, 0)`.

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

## Control Options

### `controls`

```ts
controls?: {
  autoRotate?: boolean | { speed?: number };
  drag?: boolean;
  keyboard?: boolean;
  wheel?: boolean;
  preventDocumentScroll?: boolean;
}
```

Built-in controls are disabled by default.

- `autoRotate`: continuously increases `rotation.y`
- `autoRotate.speed` default: `0.18` degrees per animation frame
- `drag`: pointer drag rotates the sphere and adds momentum after release
- `wheel`: wheel rotates the sphere; modifier-wheel zooms
- `keyboard`: arrow keys rotate; command-arrow up/down zooms
- `preventDocumentScroll`: calls `event.preventDefault()` while handling wheel input

Selection is handled by click/tap when drag movement stays below the click threshold.

## Selection And State Options

### `selectedId`

```ts
selectedId?: string | null
```

Currently selected item id.

- Default: `null`
- Pass an item id to select it
- Pass `null` to clear selection

### `onSelect`

```ts
onSelect?: (item: TItem & SpherItem) => void
```

Called when built-in controls select an item, or when `instance.select(id)` selects an existing item.
In React, use `onItemSelect`.

### `devicePixelRatio`

```ts
devicePixelRatio?: number
```

Canvas backing-store scale.

- Default: `globalThis.devicePixelRatio`, falling back to `1`
- Override this for deterministic tests or explicit rendering scale

## Render State

Custom renderers receive this state object:

```ts
type SpherRenderState<TItem = SpherItem> = {
  item: PositionedItem<TItem>;
  edgeFactor: number;
  faceMode: "face-out" | "face-in";
  front: boolean;
  coverVisible: boolean;
  normalY: number;
  perspectiveScale: number;
  selected: boolean;
  visibleSide: "outside" | "inside";
  visibility: number;
  viewMode: "inside" | "shell";
};
```

Common fields:

- `item`: resolved item with `latitude`, `longitude`, `radius`, and `size`
- `selected`: whether this item matches `selectedId`
- `visibility`: current alpha multiplier, from `0` to `1`
- `coverVisible`: whether the configured cover side is visible
- `visibleSide`: `"outside"` or `"inside"`
- `viewMode`: `"shell"` before `zoom.insideThreshold`, `"inside"` after it
- `perspectiveScale`: current projection scale for depth
- `edgeFactor`: how close the item is to the visual sphere edge
- `normalY`: vertical normal, clamped to `-1..1`

## Instance Methods

`createSpher` returns:

```ts
type SpherInstance<TItem = SpherItem> = {
  update: (patch: Partial<SpherOptions<TItem>>) => void;
  select: (id: string | null) => void;
  rotateTo: (rotation: { x: number; y: number }) => void;
  destroy: () => void;
  itemState: (id: string) => SpherRenderState<TItem> | null;
  getState: () => SpherState<TItem>;
  subscribe: (listener: (state: SpherState<TItem>) => void) => () => void;
};
```

- `update`: patches options and re-renders
- `select`: updates selection and calls `onSelect` when the id exists
- `rotateTo`: cancels momentum and applies a target rotation
- `destroy`: removes listeners, observers, animation frames, and cached projections
- `itemState`: returns the latest render state for a projected item
- `getState`: returns the public state snapshot
- `subscribe`: listens to public state changes and returns an unsubscribe function

## React Props

```tsx
import { Spher } from "spher/react";

<Spher
  items={items}
  radius="auto"
  size={{ ratio: 0.1 }}
  controls={{ drag: true, wheel: true }}
  onItemSelect={(item) => console.log(item.id)}
/>;
```

`Spher` renders a `<canvas>` and forwards standard canvas attributes. It sets these default
styles:

```ts
{
  display: "block",
  touchAction: "none",
}
```

Pass `className`, `style`, and other canvas attributes as usual.
