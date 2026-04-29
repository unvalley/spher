# orba

`orba` is a React component for exploring image cards on an interactive spherical archive.

## Install

```sh
npm install orba
```

## Usage

```tsx
import { SphericalArchive } from "orba";

const items = [
  {
    id: "socrates",
    title: "Socrates",
    image: "/images/socrates.jpg",
    year: -470,
  },
];

export const Example = () => (
  <SphericalArchive
    items={items}
    title="Archive"
    renderDetail={(selected) => <div>{selected.title}</div>}
  />
);
```

## Styling

The current package uses Tailwind class names. If your app purges Tailwind classes, include the package output in your Tailwind content paths:

```js
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./node_modules/orba/dist/**/*.{js,mjs}",
  ],
};
```

## License

MIT
