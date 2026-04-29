# orba

`orba` provides framework-agnostic spherical archive placement utilities with an optional React component for exploring image cards.

## Install

```sh
npm install orba
```

## Usage

### Core

```ts
import { positionItems } from "orba/core";

const positioned = positionItems(
  [
    {
      id: "socrates",
      title: "Socrates",
      image: "/images/socrates.jpg",
      year: -470,
    },
  ],
  560,
  "fibonacci",
);
```

### React

```tsx
import { SphericalArchive } from "orba/react";

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
