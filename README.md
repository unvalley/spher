# spher

An interactive spher(e) layout engine based on canvas.

https://github.com/user-attachments/assets/fdd3f7f9-761b-4bba-bfd2-dafc9f3ec17a

```sh
npm install spher
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

## Resources

See [demo/react](demo/react) for a styled React example.

See [docs/options.md](docs/options.md) for detailed option reference.

## License

MIT
