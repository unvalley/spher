# spher options

`createSpher(canvas, options)` creates and controls a canvas sphere.
`Spher` from `spher/react` accepts the same options as props, except `onSelect` is named
`onItemSelect`.

```ts
import { createSpher } from "spher";

const instance = createSpher(canvas, {
  items,
  radius: "auto",
  size: { ratio: 0.1, min: 48, max: 96 },
  controls: { drag: true, wheel: true },
});
```

## Items

`items` is required. Every item must have a stable `id`.

```ts
type SpherItem = {
  id: string;
  cover?: string | CanvasImageSource | null;
};
```

`cover` is only used by the default card renderer. String covers are loaded as images and
cached by item id. Pass `render` when you want full control over item drawing.

## Option Summary

| Option | Type | Default |
| --- | --- | --- |
| `items` | `Array<TItem & SpherItem>` | Required |
| `radius` | `number \| "auto"` | `320` |
| `size` | `number \| "auto" \| { ratio?, min?, max? } \| fn` | `64` |
| `placement` | `"fibonacci" \| "grid"` | `"fibonacci"` |
| `position` | `(item, index, items) => { latitude, longitude } \| null` | Auto placement |
| `perspective` | `number` | `900` |
| `rotation` | `{ x: number; y: number }` | `{ x: 0, y: 0 }` |
| `tilt` | `number \| { x?, y?, z? }` | `{ x: 0, y: 0, z: 0 }` |
| `zoom` | `{ value?, min?, max?, insideThreshold? }` | See below |
| `coverSide` | `"outside" \| "inside"` | `"outside"` |
| `card` | Card renderer style options | Default card style |
| `render` | `(context, item, state) => void` | Default card renderer |
| `controls` | Built-in control options | Disabled |
| `selectedId` | `string \| null` | `null` |
| `onSelect` | `(item) => void` | None |
| `devicePixelRatio` | `number` | `globalThis.devicePixelRatio ?? 1` |

## Layout

`radius: "auto"` uses `42%` of the canvas shorter side and updates on resize.

`size` controls the item size passed to render state as `state.item.size`.

- `number`: fixed CSS pixel size.
- `"auto"`: `10%` of the sphere diameter.
- `{ ratio, min, max }`: `radius * 2 * ratio`, clamped by optional bounds. `ratio` defaults to
  `0.1`.
- Function: resolves a size per item.

`placement` is used when `position` does not return coordinates.

- `"fibonacci"`: even distribution for arbitrary item counts.
- `"grid"`: latitude/longitude rows.

`position` can override placement per item:

```ts
position: (item) => ({ latitude: item.lat, longitude: item.lng });
```

Coordinates are degrees. Latitude is clamped to `-82..82`; longitude `0` starts at the front
of the camera.

## View

`rotation` is the interactive or controlled rotation in degrees.

- `x`: pitch. Built-in controls clamp it to `-72..72`.
- `y`: yaw. It is not bounded.

`tilt` is a static offset applied before `rotation`. A number means `{ x: value, y: 0, z: 0 }`.
Use it for the base angle of the sphere.

`perspective` controls depth projection. Higher values look flatter; lower values exaggerate
depth.

`zoom` defaults to:

```ts
{
  value: 1,
  min: 0.66,
  max: 4.4,
  insideThreshold: 1.32,
}
```

When `value >= insideThreshold`, `viewMode` becomes `"inside"`. The public state still reports
the original `zoom.value`; the renderer uses an internal inside-view scale.

## Rendering

The root `createSpher` export uses the built-in card renderer unless `render` is provided.

```ts
card?: {
  borderColor?: string;
  backBorderColor?: string;
  selectedBorderColor?: string;
  borderWidth?: number;
  selectedBorderWidth?: number;
}
```

Card defaults:

| Field | Default |
| --- | --- |
| `borderColor` | `"rgba(15, 23, 42, 0.16)"` |
| `backBorderColor` | `borderColor ?? "rgba(15, 23, 42, 0.2)"` |
| `selectedBorderColor` | `"rgba(17, 24, 39, 0.96)"` |
| `borderWidth` | `1` |
| `selectedBorderWidth` | `2` |

`coverSide` chooses which sphere-facing side shows the main cover:

- `"outside"`: cover faces the outside of the sphere.
- `"inside"`: cover faces the inside of the sphere.

Use `render` for custom drawing. The canvas transform is already positioned on the item plane,
so draw around `(0, 0)`.

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

Custom renderers receive:

```ts
type SpherRenderState<TItem = SpherItem> = {
  item: PositionedItem<TItem>;
  edgeFactor: number;
  coverSide: "outside" | "inside";
  front: boolean;
  normalY: number;
  perspectiveScale: number;
  selected: boolean;
  visibleSide: "outside" | "inside";
  visibility: number;
  viewMode: "inside" | "outside";
};
```

Most custom renderers only need `item`, `selected`, `visibility`, `coverSide`,
`visibleSide`, `viewMode`, and `perspectiveScale`. If you need to know whether the configured
cover side is currently visible, compare `coverSide === visibleSide`.

## Controls

Controls are opt-in.

```ts
controls?: {
  autoRotate?: boolean | { speed?: number };
  drag?: boolean;
  keyboard?: boolean;
  wheel?: boolean;
  preventDocumentScroll?: boolean;
}
```

- `autoRotate`: increments `rotation.y`; speed defaults to `0.18` degrees per frame.
- `drag`: pointer drag rotates the sphere and applies momentum on release.
- `wheel`: plain wheel rotates; `ctrl`, `meta`, or `alt` wheel zooms.
- `keyboard`: arrow keys rotate; `meta` + arrow up/down zooms.
- `preventDocumentScroll`: calls `preventDefault()` for handled wheel input.

Click or tap selection is handled by the drag control when movement stays below the click
threshold.

## Selection And State

`selectedId` controls the selected item. Pass `null` to clear it.

`onSelect` runs when built-in controls select an item, or when `instance.select(id)` selects an
existing item. In React, use `onItemSelect`.

```tsx
import { Spher } from "spher/react";

<Spher
  items={items}
  controls={{ drag: true, wheel: true }}
  selectedId={selectedId}
  onItemSelect={(item) => setSelectedId(item.id)}
/>;
```

## Instance

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

- `update`: patches options and renders again.
- `select`: updates selection; calls `onSelect` when the id exists.
- `rotateTo`: cancels momentum and applies a target rotation.
- `destroy`: removes listeners, observers, animation frames, and cached projections.
- `itemState`: returns the latest render state for an item.
- `getState`: returns the public state snapshot.
- `subscribe`: listens to public state changes and returns an unsubscribe function.

## React

`Spher` renders a canvas, forwards standard canvas attributes, and applies these default styles:

```ts
{
  display: "block",
  touchAction: "none",
}
```

Pass `className`, `style`, and other canvas attributes as usual.
