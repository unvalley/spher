import { useMemo, useState } from "react";
import { Orba, type OrbaRenderState } from "../../../src/react.js";
import type { OrbaDomItem } from "../../../src/dom/index.js";

type ArchiveItem = OrbaDomItem & {
  title: string;
  year: number;
  category: string;
  image: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  cardSize: number;
};

const items: ArchiveItem[] = [
  {
    id: "socrates",
    title: "Socrates",
    year: -470,
    category: "philosophy",
    image: "https://images.unsplash.com/photo-1604076913837-52ab5629fba9?auto=format&fit=crop&w=420&q=80",
    coordinates: { latitude: 24, longitude: -18 },
    cardSize: 88,
  },
  {
    id: "alexandria",
    title: "Library of Alexandria",
    year: -283,
    category: "archive",
    image: "https://images.unsplash.com/photo-1519682577862-22b62b24e493?auto=format&fit=crop&w=420&q=80",
    coordinates: { latitude: 2, longitude: 26 },
    cardSize: 96,
  },
  {
    id: "astrolabe",
    title: "Astrolabe",
    year: 150,
    category: "instrument",
    image: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=420&q=80",
    coordinates: { latitude: -18, longitude: 70 },
    cardSize: 76,
  },
  {
    id: "printing",
    title: "Movable Type",
    year: 1040,
    category: "archive",
    image: "https://images.unsplash.com/photo-1495020689067-958852a7765e?auto=format&fit=crop&w=420&q=80",
    coordinates: { latitude: 36, longitude: 122 },
    cardSize: 82,
  },
  {
    id: "observatory",
    title: "Observatory",
    year: 1577,
    category: "instrument",
    image: "https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=420&q=80",
    coordinates: { latitude: -32, longitude: -108 },
    cardSize: 90,
  },
  {
    id: "web",
    title: "World Wide Web",
    year: 1989,
    category: "network",
    image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=420&q=80",
    coordinates: { latitude: 10, longitude: -148 },
    cardSize: 84,
  },
];

const categories = ["all", "archive", "instrument", "network", "philosophy"];

export const ArchiveDemo = () => {
  const [category, setCategory] = useState("all");
  const [selectedId, setSelectedId] = useState(items[0].id);
  const visibleItems = useMemo(
    () =>
      category === "all"
        ? items
        : items.filter((item) => item.category === category),
    [category],
  );
  const selected =
    visibleItems.find((item) => item.id === selectedId) ?? visibleItems[0];

  return (
    <main className="archive-demo">
      <header className="archive-header">
        <div>
          <p className="archive-kicker">orba React demo</p>
          <h1>Archive sphere</h1>
        </div>
        <nav className="archive-filters" aria-label="Filter archive">
          {categories.map((value) => (
            <button
              key={value}
              type="button"
              data-active={category === value}
              onClick={() => {
                setCategory(value);
                const nextItems =
                  value === "all"
                    ? items
                    : items.filter((item) => item.category === value);
                setSelectedId(nextItems[0]?.id ?? "");
              }}
            >
              {value}
            </button>
          ))}
        </nav>
      </header>

      <Orba
        className="archive-sphere"
        items={visibleItems}
        radius={260}
        perspective={860}
        controls={{ drag: true, wheel: true }}
        selectedId={selected?.id ?? null}
        getItemPosition={(item) => item.coordinates}
        getItemSize={(item) => item.cardSize}
        onSelect={(item) => setSelectedId(item.id)}
        renderItem={(item, state) => (
          <ArchiveCard item={item} state={state} />
        )}
      />

      {selected ? (
        <aside className="archive-detail">
          <p>{selected.category}</p>
          <h2>{selected.title}</h2>
          <span>{selected.year}</span>
        </aside>
      ) : null}
    </main>
  );
};

const ArchiveCard = ({
  item,
  state,
}: {
  item: ArchiveItem;
  state: OrbaRenderState<ArchiveItem>;
}) => {
  return (
    <button
      type="button"
      className="archive-card"
      data-selected={state.selected}
      style={{ opacity: state.visibility }}
    >
      <img src={item.image} alt="" />
      <span>{item.title}</span>
    </button>
  );
};
