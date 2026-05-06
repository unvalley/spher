# spher

An interactive spher(e) layout engine based on canvas.

https://github.com/user-attachments/assets/fdd3f7f9-761b-4bba-bfd2-dafc9f3ec17a

## Install

```sh
npm install spher
```

## React

```tsx
import { Spher } from "spher/react";

export function SpherUI() {
  return (
    <Spher
      className="spher"
      controls={{ drag: true, wheel: true, autoRotate: { speed: 0.18 } }}
      items={[
        { id: "tokyo", cover: "/tokyo.jpg" },
        { id: "sf", cover: "/sf.jpg" },
      ]}
      onItemSelect={(item) => console.log(item.id)}
      radius="auto"
      size={{ ratio: 0.1 }}
    />
  );
}
```

```css
.spher {
  cursor: grab;
  width: 480px;
}

.spher:active {
  cursor: grabbing;
}
```

## Canvas

Use `createSpher` when you want to provide and manage the canvas yourself.

```ts
import { createSpher } from "spher";

const instance = createSpher(canvas, {
  items,
  controls: { drag: true, wheel: true },
  radius: 320,
  size: 64,
});

instance.destroy();
```

## Options

- `items`: objects with a stable `id`; add `cover` for the default card renderer.
- `radius`: sphere radius in pixels, or `"auto"` to fit the canvas.
- `size`: item size in pixels, a callback, or `{ ratio }` for responsive cards.
- `position`: optional latitude/longitude placement per item.
- `controls`: enables drag, wheel, keyboard, and auto-rotation.
- `render`: custom canvas renderer for each projected item.

## Demo

See [demo/react](demo/react) for a styled React example.

## License

MIT
